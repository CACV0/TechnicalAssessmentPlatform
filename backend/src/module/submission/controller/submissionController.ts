import debugLib from 'debug';
import { NextFunction, Request, Response } from 'express';
import apiResponse from '../../../generic/response';
import submissionService from '../service/submissionService';
import evaluationService from '../../evaluation/service/evaluationService';

const debug = debugLib('platform:SubmissionController');

class SubmissionController {
	public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';
		const { sessionId, questionId } = req.params;

		try {
			debug('[%s] Creating submission. Session: %s Question: %s', rqUID, sessionId, questionId);
			const submission = await submissionService.create(rqUID, sessionId, questionId, req.body);
			debug('[%s] Starting evaluation for submission: %s', rqUID, submission.id);
			const evaluatedSubmission = await evaluationService.evaluate(rqUID, submission.id);
			debug(
				'[%s] Submission evaluation completed: %s Status: %s',
				rqUID,
				evaluatedSubmission.id,
				evaluatedSubmission.status
			);
			res
				.status(201)
				.json(
					apiResponse.success(
						rqUID,
						201,
						'SUBMISSION_CREATED',
						'Submission created and evaluated successfully',
						evaluatedSubmission
					)
				);
		} catch (error) {
			next(error);
		}
	}

	public async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';
		const { submissionId } = req.params;
		try {
			debug('[%s] Getting submission: %s', rqUID, submissionId);
			const submission = await submissionService.findById(rqUID, submissionId);
			res
				.status(200)
				.json(
					apiResponse.success(
						rqUID,
						200,
						'SUBMISSION_FOUND',
						'Submission retrieved successfully',
						submission
					)
				);
		} catch (error) {
			next(error);
		}
	}

	public async findBySessionAndQuestion(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';
		const { sessionId, questionId } = req.params;
		try {
			debug('[%s] Getting submissions. Session: %s Question: %s', rqUID, sessionId, questionId);
			const submissions = await submissionService.findBySessionAndQuestion(
				rqUID,
				sessionId,
				questionId
			);
			res
				.status(200)
				.json(
					apiResponse.success(
						rqUID,
						200,
						'SUBMISSIONS_FOUND',
						'Submissions retrieved successfully',
						submissions
					)
				);
		} catch (error) {
			next(error);
		}
	}

	public async findResult(req: Request, res: Response, next: NextFunction): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';
		const { submissionId } = req.params;
		try {
			debug('[%s] Getting submission result: %s', rqUID, submissionId);
			const result = await submissionService.findResult(rqUID, submissionId);
			res
				.status(200)
				.json(
					apiResponse.success(
						rqUID,
						200,
						'SUBMISSION_RESULT_FOUND',
						'Submission result retrieved successfully',
						result
					)
				);
		} catch (error) {
			next(error);
		}
	}
}

export default new SubmissionController();
