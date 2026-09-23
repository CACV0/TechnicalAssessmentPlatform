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

export type QuestionProgressResult = 'CORRECT' | 'INCORRECT' | 'NOT_ANSWERED';

export interface QuestionProgressRow {
	questionId: string;
	title: string;
	displayOrder: number;
	maxScore: number;
	attempts: number;
	bestScore: number | null;
	lastSubmissionId: string | null;
}

export interface QuestionProgress extends QuestionProgressRow {
	result: QuestionProgressResult;
}

export interface AssessmentSessionSummary {
	session: AssessmentSession;
	assessmentName: string;
	timeLimitMinutes: number;
	remainingSeconds: number;
	elapsedSeconds: number;
	totalQuestions: number;
	answeredQuestions: number;
	correctQuestions: number;
	incorrectQuestions: number;
	score: number;
	maxScore: number;
	percentage: number;
	questions: QuestionProgress[];
}
