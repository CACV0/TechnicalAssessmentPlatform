export type TestCaseResultStatus = 'PASSED' | 'FAILED' | 'ERROR' | 'TIMEOUT';

export type TestCaseResultVisibility = 'PUBLIC' | 'HIDDEN';

export interface TestCaseResult {
	submissionId: string;
	testCaseId: string;
	status: TestCaseResultStatus;
	actualOutput: string | null;
	errorMessage: string | null;
	executionTimeMs: number | null;
}

export interface TestCaseResultDetail extends TestCaseResult {
	visibility: TestCaseResultVisibility;
}

export interface CreateTestCaseResultInput {
	submissionId: string;
	testCaseId: string;
	status: TestCaseResultStatus;
	actualOutput?: string | null;
	errorMessage?: string | null;
	executionTimeMs?: number | null;
}
