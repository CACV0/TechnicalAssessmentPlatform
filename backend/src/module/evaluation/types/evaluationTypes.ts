export type RunTestCaseStatus = 'PASSED' | 'FAILED' | 'ERROR' | 'TIMEOUT';

export interface RunCodeInput {
	programmingLanguageId: string;
	sourceCode: string;
}

export interface RunTestCaseResult {
	testCaseId: string;
	status: RunTestCaseStatus;
	input: string | null;
	actualOutput: string | null;
	errorMessage: string | null;
	executionTimeMs: number | null;
}

export interface RunCodeResult {
	status: 'COMPLETED' | 'COMPILE_ERROR';
	compileError: string | null;
	results: RunTestCaseResult[];
}
