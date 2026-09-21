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
