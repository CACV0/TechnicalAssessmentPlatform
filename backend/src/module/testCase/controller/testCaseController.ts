import { NextFunction, Request, Response } from 'express';
import debugLib from 'debug';
import testCaseService from '../service/testCaseService';
import apiResponse from '../../../generic/response';

const debug = debugLib('platform:TestCaseController');

class TestCaseController {
	public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';
		const { assessmentId, questionId } = req.params;
		try {
			debug('[%s] Creating test case for question: %s', rqUID, questionId);
			const testCase = await testCaseService.create(rqUID, assessmentId, questionId, req.body);
			debug('[%s] Test case created: %s', rqUID, testCase.id);
			res
				.status(201)
				.json(
					apiResponse.success(
						rqUID,
						201,
						'TEST_CASE_CREATED',
						'Test case created successfully',
						testCase
					)
				);
		} catch (error) {
			debug('[%s] Error creating test case: %O', rqUID, error);
			next(error);
		}
	}

	public async findAllByQuestionId(req: Request, res: Response, next: NextFunction): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';
		const { assessmentId, questionId } = req.params;
		try {
			debug('[%s] Getting test cases for question: %s', rqUID, questionId);
			const testCases = await testCaseService.findAllByQuestionId(rqUID, assessmentId, questionId);
			debug('[%s] Test cases retrieved for question %s: %d', rqUID, questionId, testCases.length);
			res
				.status(200)
				.json(
					apiResponse.success(
						rqUID,
						200,
						'TEST_CASES_FOUND',
						'Test cases retrieved successfully',
						testCases
					)
				);
		} catch (error) {
			debug('[%s] Error getting test cases for question %s: %O', rqUID, questionId, error);
			next(error);
		}
	}

	public async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';
		const { assessmentId, questionId, testCaseId } = req.params;
		try {
			debug('[%s] Getting test case: %s', rqUID, testCaseId);
			const testCase = await testCaseService.findById(rqUID, assessmentId, questionId, testCaseId);
			debug('[%s] Test case retrieved: %s', rqUID, testCaseId);
			res
				.status(200)
				.json(
					apiResponse.success(
						rqUID,
						200,
						'TEST_CASE_FOUND',
						'Test case retrieved successfully',
						testCase
					)
				);
		} catch (error) {
			debug('[%s] Error getting test case %s: %O', rqUID, testCaseId, error);
			next(error);
		}
	}

	public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';
		const { assessmentId, questionId, testCaseId } = req.params;
		try {
			debug('[%s] Updating test case: %s', rqUID, testCaseId);
			const testCase = await testCaseService.update(
				rqUID,
				assessmentId,
				questionId,
				testCaseId,
				req.body
			);
			debug('[%s] Test case updated: %s', rqUID, testCaseId);
			res
				.status(200)
				.json(
					apiResponse.success(
						rqUID,
						200,
						'TEST_CASE_UPDATED',
						'Test case updated successfully',
						testCase
					)
				);
		} catch (error) {
			debug('[%s] Error updating test case %s: %O', rqUID, testCaseId, error);
			next(error);
		}
	}

	public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';
		const { assessmentId, questionId, testCaseId } = req.params;
		try {
			debug('[%s] Deleting test case: %s', rqUID, testCaseId);
			await testCaseService.delete(rqUID, assessmentId, questionId, testCaseId);
			debug('[%s] Test case deleted: %s', rqUID, testCaseId);
			res.status(200).json(
				apiResponse.success(rqUID, 200, 'TEST_CASE_DELETED', 'Test case deleted successfully', {
					id: testCaseId,
				})
			);
		} catch (error) {
			debug('[%s] Error deleting test case %s: %O', rqUID, testCaseId, error);
			next(error);
		}
	}
}

export default new TestCaseController();
