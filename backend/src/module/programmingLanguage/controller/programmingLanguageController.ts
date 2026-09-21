import { NextFunction, Request, Response } from 'express';
import debugLib from 'debug';
import programmingLanguageService from '../service/programmingLanguageService';
import apiResponse from '../../../generic/response';

const debug = debugLib('platform:ProgrammingLanguageController');

class ProgrammingLanguageController {
	public async findAllActive(req: Request, res: Response, next: NextFunction): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';

		try {
			debug('[%s] Getting active programming languages', rqUID);
			const programmingLanguages = await programmingLanguageService.findAllActive(rqUID);
			debug('[%s] Active programming languages retrieved: %d', rqUID, programmingLanguages.length);
			res
				.status(200)
				.json(
					apiResponse.success(
						rqUID,
						200,
						'PROGRAMMING_LANGUAGES_FOUND',
						'Programming languages retrieved successfully',
						programmingLanguages
					)
				);
		} catch (error) {
			debug('[%s] Error getting active programming languages: %O', rqUID, error);
			next(error);
		}
	}

	public async findByQuestionId(req: Request, res: Response, next: NextFunction): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';
		const { assessmentId, questionId } = req.params;

		try {
			debug('[%s] Getting languages for question: %s', rqUID, questionId);
			const programmingLanguages = await programmingLanguageService.findByQuestionId(
				rqUID,
				assessmentId,
				questionId
			);
			debug(
				'[%s] Languages retrieved for question %s: %d',
				rqUID,
				questionId,
				programmingLanguages.length
			);
			res
				.status(200)
				.json(
					apiResponse.success(
						rqUID,
						200,
						'QUESTION_LANGUAGES_FOUND',
						'Question languages retrieved successfully',
						programmingLanguages
					)
				);
		} catch (error) {
			debug('[%s] Error getting languages for question %s: %O', rqUID, questionId, error);
			next(error);
		}
	}

	public async updateQuestionLanguages(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';
		const { assessmentId, questionId } = req.params;

		try {
			debug('[%s] Updating languages for question: %s', rqUID, questionId);
			const programmingLanguages = await programmingLanguageService.updateQuestionLanguages(
				rqUID,
				assessmentId,
				questionId,
				req.body
			);
			debug('[%s] Languages updated for question: %s', rqUID, questionId);
			res
				.status(200)
				.json(
					apiResponse.success(
						rqUID,
						200,
						'QUESTION_LANGUAGES_UPDATED',
						'Question languages updated successfully',
						programmingLanguages
					)
				);
		} catch (error) {
			debug('[%s] Error updating languages for question %s: %O', rqUID, questionId, error);
			next(error);
		}
	}
}

export default new ProgrammingLanguageController();
