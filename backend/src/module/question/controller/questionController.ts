import { NextFunction, Request, Response } from 'express';
import debugLib from 'debug';

import questionService from '../service/questionService';
import apiResponse from '../../../generic/response';

const debug = debugLib('platform:QuestionController');

class QuestionController {
	public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';
		const { assessmentId } = req.params;
		try {
			debug('[%s] Creating question for assessment: %s', rqUID, assessmentId);
			const question = await questionService.create(rqUID, assessmentId, req.body);
			debug('[%s] Question created: %s', rqUID, question.id);
			res
				.status(201)
				.json(
					apiResponse.success(
						rqUID,
						201,
						'QUESTION_CREATED',
						'Question created successfully',
						question
					)
				);
		} catch (error) {
			debug('[%s] Error creating question: %O', rqUID, error);
			next(error);
		}
	}

	public async findAllByAssessmentId(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';
		const { assessmentId } = req.params;
		try {
			debug('[%s] Getting questions for assessment: %s', rqUID, assessmentId);
			const questions = await questionService.findAllByAssessmentId(rqUID, assessmentId);
			debug('[%s] Questions retrieved: %d', rqUID, questions.length);
			res
				.status(200)
				.json(
					apiResponse.success(
						rqUID,
						200,
						'QUESTIONS_FOUND',
						'Questions retrieved successfully',
						questions
					)
				);
		} catch (error) {
			debug('[%s] Error getting questions: %O', rqUID, error);
			next(error);
		}
	}

	public async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';
		const { assessmentId, questionId } = req.params;
		try {
			debug('[%s] Getting question: %s', rqUID, questionId);
			const question = await questionService.findById(rqUID, assessmentId, questionId);
			debug('[%s] Question retrieved: %s', rqUID, questionId);
			res
				.status(200)
				.json(
					apiResponse.success(
						rqUID,
						200,
						'QUESTION_FOUND',
						'Question retrieved successfully',
						question
					)
				);
		} catch (error) {
			debug('[%s] Error getting question %s: %O', rqUID, questionId, error);
			next(error);
		}
	}

	public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';
		const { assessmentId, questionId } = req.params;
		try {
			debug('[%s] Updating question: %s', rqUID, questionId);
			const question = await questionService.update(rqUID, assessmentId, questionId, req.body);
			debug('[%s] Question updated: %s', rqUID, questionId);
			res
				.status(200)
				.json(
					apiResponse.success(
						rqUID,
						200,
						'QUESTION_UPDATED',
						'Question updated successfully',
						question
					)
				);
		} catch (error) {
			debug('[%s] Error updating question %s: %O', rqUID, questionId, error);
			next(error);
		}
	}

	public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';
		const { assessmentId, questionId } = req.params;
		try {
			debug('[%s] Deleting question: %s', rqUID, questionId);
			await questionService.delete(rqUID, assessmentId, questionId);
			debug('[%s] Question deleted: %s', rqUID, questionId);
			res.status(200).json(
				apiResponse.success(rqUID, 200, 'QUESTION_DELETED', 'Question deleted successfully', {
					id: questionId,
				})
			);
		} catch (error) {
			debug('[%s] Error deleting question %s: %O', rqUID, questionId, error);
			next(error);
		}
	}
}

export default new QuestionController();
