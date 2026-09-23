export type AssessmentStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export interface Assessment {
	id: string;
	name: string;
	description: string | null;
	timeLimitMinutes: number;
	status: AssessmentStatus;
	createdAt: Date;
	updatedAt: Date;
	questionCount: number;
}

export interface CreateAssessmentInput {
	name: string;
	description?: string;
	timeLimitMinutes: number;
}

export interface UpdateAssessmentInput {
	name?: string;
	description?: string;
	timeLimitMinutes?: number;
}
