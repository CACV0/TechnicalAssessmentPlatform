import debugLib from 'debug';
import AppError from '../../../generic/error';
import assessmentRepository from '../../assessment/repository/assessmentRepository';
import assessmentSessionRepository from '../repository/assessmentSessionRepository';
import {
	AssessmentSession,
	AssessmentSessionSummary,
	CreateAssessmentSessionInput,
	QuestionProgress,
	QuestionProgressResult,
} from '../types/assessmentSessionTypes';

const debug = debugLib('platform:AssessmentSessionService');

class AssessmentSessionService {
	public async create(
		rqUID: string,
		assessmentId: string,
		data: CreateAssessmentSessionInput
	): Promise<AssessmentSession> {
		debug('[%s] Creating assessment session. Assessment: %s', rqUID, assessmentId);
		const assessment = await assessmentRepository.findById(rqUID, assessmentId);

		if (!assessment) {
			debug('[%s] Assessment not found: %s', rqUID, assessmentId);

			throw new AppError(404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
		}

		if (assessment.status !== 'PUBLISHED') {
			debug(
				'[%s] Assessment is not available. ID: %s Status: %s',
				rqUID,
				assessmentId,
				assessment.status
			);

			throw new AppError(
				409,
				'ASSESSMENT_NOT_AVAILABLE',
				'Only PUBLISHED assessments can be started'
			);
		}

		const startedAt = new Date();
		const expiresAt = new Date(startedAt.getTime() + assessment.timeLimitMinutes * 60 * 1000);
		const session = await assessmentSessionRepository.create(rqUID, assessmentId, data, expiresAt);
		debug('[%s] Assessment session created successfully: %s', rqUID, session.id);
		return session;
	}

	public async findById(rqUID: string, id: string): Promise<AssessmentSession> {
		debug('[%s] Getting assessment session: %s', rqUID, id);
		const session = await assessmentSessionRepository.findById(rqUID, id);

		if (!session) {
			debug('[%s] Assessment session not found: %s', rqUID, id);

			throw new AppError(404, 'ASSESSMENT_SESSION_NOT_FOUND', 'Assessment session not found');
		}

		if (session.status === 'IN_PROGRESS' && new Date().getTime() >= session.expiresAt.getTime()) {
			debug('[%s] Assessment session expired: %s', rqUID, id);

			return assessmentSessionRepository.updateStatus(rqUID, id, 'EXPIRED');
		}
		return session;
	}

	public async getSummary(rqUID: string, id: string): Promise<AssessmentSessionSummary> {
		debug('[%s] Getting assessment session summary: %s', rqUID, id);
		const session = await this.findById(rqUID, id);
		const assessment = await assessmentRepository.findById(rqUID, session.assessmentId);

		if (!assessment) {
			throw new AppError(404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
		}
		const progressRows = await assessmentSessionRepository.findQuestionProgress(
			rqUID,
			session.id,
			session.assessmentId
		);
		const questions: QuestionProgress[] = progressRows.map((row) => ({
			...row,
			result: this.getQuestionResult(row.bestScore, row.maxScore),
		}));
		const now = Date.now();
		const endTime = session.completedAt?.getTime() ?? Math.min(now, session.expiresAt.getTime());
		const remainingSeconds =
			session.status === 'IN_PROGRESS'
				? Math.max(0, Math.floor((session.expiresAt.getTime() - now) / 1000))
				: 0;
		const score = questions.reduce((total, question) => total + (question.bestScore ?? 0), 0);
		const maxScore = questions.reduce((total, question) => total + question.maxScore, 0);
		return {
			session,
			assessmentName: assessment.name,
			timeLimitMinutes: assessment.timeLimitMinutes,
			remainingSeconds,
			elapsedSeconds: Math.max(0, Math.floor((endTime - session.startedAt.getTime()) / 1000)),
			totalQuestions: questions.length,
			answeredQuestions: questions.filter((question) => question.result !== 'NOT_ANSWERED').length,
			correctQuestions: questions.filter((question) => question.result === 'CORRECT').length,
			incorrectQuestions: questions.filter((question) => question.result === 'INCORRECT').length,
			score: this.round(score),
			maxScore: this.round(maxScore),
			percentage: maxScore > 0 ? this.round((score / maxScore) * 100) : 0,
			questions,
		};
	}

	public async complete(rqUID: string, id: string): Promise<AssessmentSession> {
		debug('[%s] Completing assessment session: %s', rqUID, id);
		const session = await this.findById(rqUID, id);

		if (session.status === 'EXPIRED') {
			debug('[%s] Assessment session cannot be completed because it is expired: %s', rqUID, id);

			throw new AppError(409, 'ASSESSMENT_SESSION_EXPIRED', 'Assessment session has expired');
		}

		if (session.status !== 'IN_PROGRESS') {
			debug(
				'[%s] Assessment session cannot be completed. ID: %s Status: %s',
				rqUID,
				id,
				session.status
			);
			throw new AppError(
				409,
				'ASSESSMENT_SESSION_NOT_COMPLETABLE',
				'Only IN_PROGRESS assessment sessions can be completed'
			);
		}
		const completedAt = new Date();
		const completedSession = await assessmentSessionRepository.updateStatus(
			rqUID,
			id,
			'COMPLETED',
			completedAt
		);
		debug('[%s] Assessment session completed successfully: %s', rqUID, id);
		return completedSession;
	}

	private getQuestionResult(bestScore: number | null, maxScore: number): QuestionProgressResult {
		if (bestScore === null) {
			return 'NOT_ANSWERED';
		}
		return bestScore >= maxScore ? 'CORRECT' : 'INCORRECT';
	}

	private round(value: number): number {
		return Math.round(value * 100) / 100;
	}
}

export default new AssessmentSessionService();
