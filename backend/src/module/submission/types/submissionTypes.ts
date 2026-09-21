export type SubmissionStatus = 'PENDING' | 'EVALUATED' | 'FAILED';

export interface Submission {
	id: string;
	assessmentSessionId: string;
	questionId: string;
	programmingLanguageId: string;
	attemptNumber: number;
	sourceCode: string;
	status: SubmissionStatus;
	score: number | null;
	errorMessage: string | null;
	submittedAt: Date;
}

export interface CreateSubmissionInput {
	programmingLanguageId: string;
	sourceCode: string;
}

export interface SubmissionTestCaseResult {
	testCaseId: string | null;
	visibility: 'PUBLIC' | 'HIDDEN';
	status: 'PASSED' | 'FAILED' | 'ERROR' | 'TIMEOUT';
	actualOutput: string | null;
	errorMessage: string | null;
	executionTimeMs: number | null;
}

export interface SubmissionResult {
	submissionId: string;
	status: SubmissionStatus;
	score: number | null;
	errorMessage: string | null;
	results: SubmissionTestCaseResult[];
}
