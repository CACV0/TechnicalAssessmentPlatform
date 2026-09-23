import debugLib from 'debug';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import {
	CodeRunner,
	LanguageRunnerConfig,
	PreparedExecution,
	PrepareResult,
	RunnerExecutionInput,
	RunnerPrepareInput,
	RunnerResult,
	RunnerStatus,
} from '../types/runnerTypes';

const debug = debugLib('platform:DockerCodeRunner');

const PREPARE_TIMEOUT_MS = 15000;
const MAX_OUTPUT_BYTES = 64 * 1024;

interface ProcessResult {
	stdout: string;
	stderr: string;
	exitCode: number | null;
	timedOut: boolean;
	outputLimitExceeded: boolean;
	executionTimeMs: number;
}

class DockerCodeRunner implements CodeRunner {
	constructor(private readonly config: LanguageRunnerConfig) {}

	public async prepare(rqUID: string, input: RunnerPrepareInput): Promise<PrepareResult> {
		debug('[%s] Preparing %s source code', rqUID, this.config.code);
		const workspace = await mkdtemp(
			path.join(tmpdir(), `technical-assessment-${this.config.code}-`)
		);

		try {
			await writeFile(path.join(workspace, this.config.fileName), input.sourceCode, 'utf8');
			const processResult = await this.runDockerProcess(
				rqUID,
				this.buildDockerArgs(
					workspace,
					this.config.prepareCommand,
					this.config.prepareNeedsWritableWorkspace,
					false
				),
				null,
				PREPARE_TIMEOUT_MS
			);

			if (processResult.timedOut) {
				throw new Error(`${this.config.code} preparation process timed out`);
			}

			if (processResult.exitCode !== 0) {
				debug('[%s] %s preparation failed', rqUID, this.config.code);
				await this.removeWorkspace(rqUID, workspace);
				return {
					execution: null,
					result: this.toRunnerResult('COMPILE_ERROR', processResult),
				};
			}

			debug('[%s] %s source code prepared successfully', rqUID, this.config.code);
			return {
				execution: {
					workspace,
				},
				result: this.toRunnerResult('SUCCESS', processResult),
			};
		} catch (error) {
			await this.removeWorkspace(rqUID, workspace);
			throw error;
		}
	}

	public async execute(
		rqUID: string,
		execution: PreparedExecution,
		input: RunnerExecutionInput
	): Promise<RunnerResult> {
		debug('[%s] Executing prepared %s source code', rqUID, this.config.code);
		const result = await this.runDockerProcess(
			rqUID,
			this.buildDockerArgs(execution.workspace, this.config.runCommand, false, true),
			input.stdin,
			input.timeoutMs
		);

		if (result.timedOut) {
			debug('[%s] %s execution timed out', rqUID, this.config.code);
			return this.toRunnerResult('TIMEOUT', result);
		}

		if (result.outputLimitExceeded) {
			debug('[%s] %s execution exceeded output limit', rqUID, this.config.code);
			return this.toRunnerResult('RUNTIME_ERROR', {
				...result,
				stderr: `${result.stderr}\nOutput limit of ${MAX_OUTPUT_BYTES} bytes exceeded`,
			});
		}

		if (result.exitCode !== 0) {
			debug('[%s] %s runtime error. Exit code: %s', rqUID, this.config.code, result.exitCode);
			return this.toRunnerResult('RUNTIME_ERROR', result);
		}

		debug('[%s] %s execution completed successfully', rqUID, this.config.code);
		return this.toRunnerResult('SUCCESS', result);
	}

	public async dispose(rqUID: string, execution: PreparedExecution): Promise<void> {
		await this.removeWorkspace(rqUID, execution.workspace);
	}

	private buildDockerArgs(
		workspace: string,
		command: string[],
		writableWorkspace: boolean,
		interactive: boolean
	): string[] {
		const envArgs = Object.entries(this.config.env ?? {}).flatMap(([key, value]) => [
			'-e',
			`${key}=${value}`,
		]);

		return [
			'run',
			'--rm',
			...(interactive ? ['-i'] : []),
			'--network',
			'none',
			'--memory',
			'128m',
			'--memory-swap',
			'128m',
			'--cpus',
			'0.5',
			'--pids-limit',
			'64',
			'--cap-drop',
			'ALL',
			'--security-opt',
			'no-new-privileges',
			'--read-only',
			'--tmpfs',
			'/tmp:rw,size=16m',
			...envArgs,
			'-v',
			`${workspace}:/workspace${writableWorkspace ? '' : ':ro'}`,
			'-w',
			'/workspace',
			this.config.image,
			...command,
		];
	}

	private runDockerProcess(
		rqUID: string,
		args: string[],
		stdin: string | null,
		timeoutMs: number
	): Promise<ProcessResult> {
		return new Promise((resolve, reject) => {
			const startedAt = Date.now();
			const containerName = `technical-assessment-${randomUUID()}`;

			let stdout = '';
			let stderr = '';
			let timedOut = false;
			let outputLimitExceeded = false;
			let settled = false;

			const dockerArgs = this.addContainerName(args, containerName);
			const child: ChildProcessWithoutNullStreams = spawn('docker', dockerArgs, {
				windowsHide: true,
				stdio: ['pipe', 'pipe', 'pipe'],
			});

			const killContainer = (reason: string): void => {
				debug('[%s] Stopping container %s: %s', rqUID, containerName, reason);
				this.forceRemoveContainer(rqUID, containerName).catch((error) => {
					debug(
						'[%s] Error removing container %s: %s',
						rqUID,
						containerName,
						error instanceof Error ? error.message : String(error)
					);
				});
			};

			const timeout = setTimeout(() => {
				timedOut = true;
				killContainer('timeout');
			}, timeoutMs);

			const appendOutput = (current: string, data: Buffer): string => {
				if (outputLimitExceeded) {
					return current;
				}
				const next = current + data.toString();
				if (
					Buffer.byteLength(stdout) + Buffer.byteLength(stderr) + data.length >
					MAX_OUTPUT_BYTES
				) {
					outputLimitExceeded = true;
					killContainer('output limit exceeded');
					return next.slice(0, MAX_OUTPUT_BYTES);
				}
				return next;
			};

			child.stdout.on('data', (data: Buffer) => {
				stdout = appendOutput(stdout, data);
			});

			child.stderr.on('data', (data: Buffer) => {
				stderr = appendOutput(stderr, data);
			});

			child.on('error', (error) => {
				clearTimeout(timeout);

				if (settled) {
					return;
				}
				settled = true;
				reject(error);
			});

			child.on('close', (code) => {
				clearTimeout(timeout);

				if (settled) {
					return;
				}
				settled = true;
				resolve({
					stdout,
					stderr,
					exitCode: timedOut ? null : code,
					timedOut,
					outputLimitExceeded,
					executionTimeMs: Date.now() - startedAt,
				});
			});

			child.stdin.on('error', () => undefined);

			if (stdin !== null) {
				child.stdin.write(stdin);
			}

			child.stdin.end();
		});
	}

	private addContainerName(args: string[], containerName: string): string[] {
		const dockerArgs = [...args];
		const runIndex = dockerArgs.indexOf('run');
		if (runIndex === -1) {
			throw new Error('Docker run command not found');
		}
		dockerArgs.splice(runIndex + 1, 0, '--name', containerName);
		return dockerArgs;
	}

	private forceRemoveContainer(rqUID: string, containerName: string): Promise<void> {
		return new Promise((resolve, reject) => {
			debug('[%s] Removing Docker container: %s', rqUID, containerName);
			const cleanup = spawn('docker', ['rm', '-f', containerName], {
				windowsHide: true,
				stdio: 'ignore',
			});

			cleanup.on('error', (error) => {
				reject(error);
			});

			cleanup.on('close', (code) => {
				if (code !== 0) {
					reject(new Error(`Docker container cleanup failed with exit code ${code}`));

					return;
				}
				debug('[%s] Docker container removed: %s', rqUID, containerName);
				resolve();
			});
		});
	}

	private async removeWorkspace(rqUID: string, workspace: string): Promise<void> {
		await rm(workspace, {
			recursive: true,
			force: true,
		});
		debug('[%s] Workspace removed', rqUID);
	}

	private toRunnerResult(status: RunnerStatus, result: ProcessResult): RunnerResult {
		return {
			status,
			stdout: result.stdout,
			stderr: result.stderr,
			exitCode: result.exitCode,
			executionTimeMs: result.executionTimeMs,
		};
	}
}

export default DockerCodeRunner;
