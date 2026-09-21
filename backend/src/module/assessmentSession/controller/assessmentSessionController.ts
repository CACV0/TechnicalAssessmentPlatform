import { NextFunction, Request, Response } from 'express';
import debugLib from 'debug';
import assessmentSessionService from '../service/assessmentSessionService';
import apiResponse from '../../../generic/response';

const debug = debugLib('platform:AssessmentSessionController');

class AssessmentSessionController {
	public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';
		const { assessmentId } = req.params;
		try {
			debug('[%s] Creating assessment session. Assessment: %s', rqUID, assessmentId);
			const session = await assessmentSessionService.create(rqUID, assessmentId, req.body);
			debug('[%s] Assessment session created: %s', rqUID, session.id);
			res
				.status(201)
				.json(
					apiResponse.success(
						rqUID,
						201,
						'ASSESSMENT_SESSION_CREATED',
						'Assessment session created successfully',
						session
					)
				);
		} catch (error) {
			debug(
				'[%s] Error creating assessment session. Assessment: %s Error: %O',
				rqUID,
				assessmentId,
				error
			);
			next(error);
		}
	}

	public async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';
		const { sessionId } = req.params;
		try {
			debug('[%s] Getting assessment session: %s', rqUID, sessionId);
			const session = await assessmentSessionService.findById(rqUID, sessionId);
			debug('[%s] Assessment session retrieved: %s', rqUID, sessionId);
			res
				.status(200)
				.json(
					apiResponse.success(
						rqUID,
						200,
						'ASSESSMENT_SESSION_FOUND',
						'Assessment session retrieved successfully',
						session
					)
				);
		} catch (error) {
			debug('[%s] Error getting assessment session %s: %O', rqUID, sessionId, error);
			next(error);
		}
	}

	public async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';
		const { sessionId } = req.params;
		try {
			debug('[%s] Completing assessment session: %s', rqUID, sessionId);
			const session = await assessmentSessionService.complete(rqUID, sessionId);
			debug('[%s] Assessment session completed: %s', rqUID, sessionId);
			res
				.status(200)
				.json(
					apiResponse.success(
						rqUID,
						200,
						'ASSESSMENT_SESSION_COMPLETED',
						'Assessment session completed successfully',
						session
					)
				);
		} catch (error) {
			debug('[%s] Error completing assessment session %s: %O', rqUID, sessionId, error);
			next(error);
		}
	}
}

export default new AssessmentSessionController();
