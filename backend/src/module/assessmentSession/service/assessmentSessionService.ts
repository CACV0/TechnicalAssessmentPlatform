import debugLib from 'debug';
import AppError from '../../../generic/error';
import assessmentRepository from '../../assessment/repository/assessmentRepository';
import assessmentSessionRepository from '../repository/assessmentSessionRepository';
import { AssessmentSession, CreateAssessmentSessionInput } from '../types/assessmentSessionTypes';

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
}

export default new AssessmentSessionService();
