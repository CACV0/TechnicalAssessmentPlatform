import debugLib from 'debug';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import {
	RunnerExecutionInput,
	RunnerPrepareInput,
	RunnerResult,
	RunnerStatus,
} from '../types/runnerTypes';

const debug = debugLib('platform:JavaRunner');

interface ProcessResult {
	stdout: string;
	stderr: string;
	exitCode: number | null;
	timedOut: boolean;
	executionTimeMs: number;
}

export interface PreparedJavaExecution {
	workspace: string;
}

export interface JavaPrepareResult {
	execution: PreparedJavaExecution | null;
	result: RunnerResult;
}

class JavaRunner {
	public async prepare(rqUID: string, input: RunnerPrepareInput): Promise<JavaPrepareResult> {
		debug('[%s] Preparing Java source code', rqUID);
		const workspace = await mkdtemp(path.join(tmpdir(), 'technical-assessment-java-'));

		try {
			await writeFile(path.join(workspace, 'Main.java'), input.sourceCode, 'utf8');
			const compileResult = await this.compile(rqUID, workspace);

			if (compileResult.status === 'COMPILE_ERROR') {
				await this.removeWorkspace(rqUID, workspace);
				return {
					execution: null,
					result: compileResult,
				};
			}
			debug('[%s] Java source code prepared successfully', rqUID);
			return {
				execution: {
					workspace,
				},
				result: compileResult,
			};
		} catch (error) {
			await this.removeWorkspace(rqUID, workspace);
			throw error;
		}
	}

	public async execute(
		rqUID: string,
		execution: PreparedJavaExecution,
		input: RunnerExecutionInput
	): Promise<RunnerResult> {
		debug('[%s] Executing prepared Java source code', rqUID);
		const result = await this.runDockerProcess(
			rqUID,
			[
				'run',
				'--rm',
				'-i',
				'--network',
				'none',
				'--memory',
				'128m',
				'--cpus',
				'0.5',
				'--pids-limit',
				'64',
				'--read-only',
				'-v',
				`${execution.workspace}:/workspace:ro`,
				'-w',
				'/workspace',
				'eclipse-temurin:21-jdk',
				'java',
				'Main',
			],
			input.stdin,
			input.timeoutMs
		);

		if (result.timedOut) {
			debug('[%s] Java execution timed out', rqUID);
			return this.toRunnerResult('TIMEOUT', result);
		}

		if (result.exitCode !== 0) {
			debug('[%s] Java runtime error. Exit code: %s', rqUID, result.exitCode);
			return this.toRunnerResult('RUNTIME_ERROR', result);
		}

		debug('[%s] Java execution completed successfully', rqUID);
		return this.toRunnerResult('SUCCESS', result);
	}

	public async dispose(rqUID: string, execution: PreparedJavaExecution): Promise<void> {
		await this.removeWorkspace(rqUID, execution.workspace);
	}

	private async compile(rqUID: string, workspace: string): Promise<RunnerResult> {
		debug('[%s] Compiling Java source code', rqUID);
		const result = await this.runDockerProcess(
			rqUID,
			[
				'run',
				'--rm',
				'--network',
				'none',
				'--memory',
				'128m',
				'--cpus',
				'0.5',
				'--pids-limit',
				'64',
				'-v',
				`${workspace}:/workspace`,
				'-w',
				'/workspace',
				'eclipse-temurin:21-jdk',
				'javac',
				'Main.java',
			],
			null,
			10000
		);

		if (result.timedOut) {
			throw new Error('Java compilation process timed out');
		}

		if (result.exitCode !== 0) {
			debug('[%s] Java compilation failed', rqUID);
			return this.toRunnerResult('COMPILE_ERROR', result);
		}
		debug('[%s] Java compilation completed successfully', rqUID);
		return this.toRunnerResult('SUCCESS', result);
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
			let settled = false;

			const dockerArgs = this.addContainerName(args, containerName);
			const child: ChildProcessWithoutNullStreams = spawn('docker', dockerArgs, {
				windowsHide: true,
				stdio: ['pipe', 'pipe', 'pipe'],
			});

			const timeout = setTimeout(() => {
				timedOut = true;
				debug('[%s] Docker process timed out. Container: %s', rqUID, containerName);
				this.forceRemoveContainer(rqUID, containerName).catch((error) => {
					debug(
						'[%s] Error removing timed out container %s: %s',
						rqUID,
						containerName,
						error instanceof Error ? error.message : String(error)
					);
				});
			}, timeoutMs);

			child.stdout.on('data', (data: Buffer) => {
				stdout += data.toString();
			});

			child.stderr.on('data', (data: Buffer) => {
				stderr += data.toString();
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
					executionTimeMs: Date.now() - startedAt,
				});
			});

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
		debug('[%s] Java workspace removed', rqUID);
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

export default new JavaRunner();
