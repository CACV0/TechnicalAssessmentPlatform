export type AssessmentSessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';

export interface AssessmentSession {
	id: string;
	assessmentId: string;
	candidateName: string;
	candidateEmail: string;
	status: AssessmentSessionStatus;
	startedAt: Date;
	expiresAt: Date;
	completedAt: Date | null;
	createdAt: Date;
}

export interface CreateAssessmentSessionInput {
	candidateName: string;
	candidateEmail: string;
}
