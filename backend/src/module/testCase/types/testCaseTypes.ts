export type TestCaseVisibility = 'PUBLIC' | 'HIDDEN';

export interface TestCase {
	id: string;
	questionId: string;
	input: string | null;
	expectedOutput: string;
	visibility: TestCaseVisibility;
	displayOrder: number;
	createdAt: Date;
}

export interface CreateTestCaseRequest {
	input?: string | null;
	expectedOutput: string;
	visibility: TestCaseVisibility;
	displayOrder: number;
}

export interface UpdateTestCaseRequest {
	input?: string | null;
	expectedOutput: string;
	visibility: TestCaseVisibility;
	displayOrder: number;
}
