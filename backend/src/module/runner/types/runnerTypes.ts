export type RunnerStatus = 'SUCCESS' | 'COMPILE_ERROR' | 'RUNTIME_ERROR' | 'TIMEOUT';

export interface RunnerPrepareInput {
	languageCode: string;
	sourceCode: string;
}

export interface RunnerExecutionInput {
	stdin: string | null;
	timeoutMs: number;
}

export interface RunnerResult {
	status: RunnerStatus;
	stdout: string;
	stderr: string;
	exitCode: number | null;
	executionTimeMs: number;
}

export interface PreparedExecution {
	workspace: string;
}

export interface PrepareResult {
	execution: PreparedExecution | null;
	result: RunnerResult;
}

export interface LanguageRunnerConfig {
	code: string;
	image: string;
	fileName: string;
	prepareCommand: string[];
	prepareNeedsWritableWorkspace: boolean;
	runCommand: string[];
	env?: Record<string, string>;
}

export interface CodeRunner {
	prepare(rqUID: string, input: RunnerPrepareInput): Promise<PrepareResult>;
	execute(
		rqUID: string,
		execution: PreparedExecution,
		input: RunnerExecutionInput
	): Promise<RunnerResult>;
	dispose(rqUID: string, execution: PreparedExecution): Promise<void>;
}
