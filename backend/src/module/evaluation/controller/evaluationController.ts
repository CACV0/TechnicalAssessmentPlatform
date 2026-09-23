import debugLib from 'debug';
import { NextFunction, Request, Response } from 'express';

import apiResponse from '../../../generic/response';
import runCodeService from '../service/runCodeService';

const debug = debugLib('platform:EvaluationController');

class EvaluationController {
	public async run(req: Request, res: Response, next: NextFunction): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';
		const { sessionId, questionId } = req.params;

		try {
			debug('[%s] Running code. Session: %s Question: %s', rqUID, sessionId, questionId);
			const result = await runCodeService.run(rqUID, sessionId, questionId, req.body);
			res
				.status(200)
				.json(
					apiResponse.success(rqUID, 200, 'CODE_EXECUTED', 'Code executed successfully', result)
				);
		} catch (error) {
			next(error);
		}
	}
}

export default new EvaluationController();
