import debugLib from 'debug';
import assessmentRepository from '../../assessment/repository/assessmentRepository';
import questionRepository from '../../question/repository/questionRepository';
import testCaseRepository from '../repository/testCaseRepository';
import { CreateTestCaseRequest, TestCase, UpdateTestCaseRequest } from '../types/testCaseTypes';
import AppError from '../../../generic/error';

const debug = debugLib('platform:TestCaseService');

class TestCaseService {
	public async create(
		rqUID: string,
		assessmentId: string,
		questionId: string,
		data: CreateTestCaseRequest
	): Promise<TestCase> {
		debug('[%s] Creating test case for question: %s', rqUID, questionId);
		const assessment = await assessmentRepository.findById(rqUID, assessmentId);

		if (!assessment) {
			debug('[%s] Assessment not found: %s', rqUID, assessmentId);

			throw new AppError(404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
		}

		if (assessment.status !== 'DRAFT') {
			debug(
				'[%s] Test case cannot be created. Assessment: %s Status: %s',
				rqUID,
				assessmentId,
				assessment.status
			);

			throw new AppError(
				409,
				'ASSESSMENT_NOT_EDITABLE',
				'Test cases can only be created for DRAFT assessments'
			);
		}
		const question = await questionRepository.findById(rqUID, assessmentId, questionId);

		if (!question) {
			debug('[%s] Question not found: %s', rqUID, questionId);

			throw new AppError(404, 'QUESTION_NOT_FOUND', 'Question not found');
		}
		const existingDisplayOrder = await testCaseRepository.findByDisplayOrder(
			rqUID,
			questionId,
			data.displayOrder
		);

		if (existingDisplayOrder) {
			debug(
				'[%s] Test case display order already exists. Question: %s Order: %d',
				rqUID,
				questionId,
				data.displayOrder
			);

			throw new AppError(
				409,
				'TEST_CASE_DISPLAY_ORDER_ALREADY_EXISTS',
				'A test case with this display order already exists'
			);
		}
		const testCase = await testCaseRepository.create(rqUID, questionId, data);
		debug('[%s] Test case created successfully: %s', rqUID, testCase.id);
		return testCase;
	}

	public async findAllByQuestionId(
		rqUID: string,
		assessmentId: string,
		questionId: string
	): Promise<TestCase[]> {
		debug('[%s] Getting test cases for question: %s', rqUID, questionId);
		const assessment = await assessmentRepository.findById(rqUID, assessmentId);

		if (!assessment) {
			debug('[%s] Assessment not found: %s', rqUID, assessmentId);

			throw new AppError(404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
		}
		const question = await questionRepository.findById(rqUID, assessmentId, questionId);

		if (!question) {
			debug('[%s] Question not found: %s', rqUID, questionId);

			throw new AppError(404, 'QUESTION_NOT_FOUND', 'Question not found');
		}
		const testCases = await testCaseRepository.findAllByQuestionId(rqUID, questionId);
		debug('[%s] Test cases retrieved for question %s: %d', rqUID, questionId, testCases.length);
		return testCases;
	}

	public async findById(
		rqUID: string,
		assessmentId: string,
		questionId: string,
		testCaseId: string
	): Promise<TestCase> {
		debug('[%s] Getting test case: %s', rqUID, testCaseId);
		const assessment = await assessmentRepository.findById(rqUID, assessmentId);

		if (!assessment) {
			debug('[%s] Assessment not found: %s', rqUID, assessmentId);

			throw new AppError(404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
		}
		const question = await questionRepository.findById(rqUID, assessmentId, questionId);

		if (!question) {
			debug('[%s] Question not found: %s', rqUID, questionId);

			throw new AppError(404, 'QUESTION_NOT_FOUND', 'Question not found');
		}
		const testCase = await testCaseRepository.findById(rqUID, questionId, testCaseId);

		if (!testCase) {
			debug('[%s] Test case not found: %s', rqUID, testCaseId);

			throw new AppError(404, 'TEST_CASE_NOT_FOUND', 'Test case not found');
		}
		return testCase;
	}

	public async update(
		rqUID: string,
		assessmentId: string,
		questionId: string,
		testCaseId: string,
		data: UpdateTestCaseRequest
	): Promise<TestCase> {
		debug('[%s] Updating test case: %s', rqUID, testCaseId);
		const assessment = await assessmentRepository.findById(rqUID, assessmentId);

		if (!assessment) {
			debug('[%s] Assessment not found: %s', rqUID, assessmentId);

			throw new AppError(404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
		}

		if (assessment.status !== 'DRAFT') {
			debug(
				'[%s] Test case cannot be updated. Assessment: %s Status: %s',
				rqUID,
				assessmentId,
				assessment.status
			);

			throw new AppError(
				409,
				'ASSESSMENT_NOT_EDITABLE',
				'Test cases can only be updated for DRAFT assessments'
			);
		}
		const question = await questionRepository.findById(rqUID, assessmentId, questionId);

		if (!question) {
			debug('[%s] Question not found: %s', rqUID, questionId);

			throw new AppError(404, 'QUESTION_NOT_FOUND', 'Question not found');
		}
		const existingTestCase = await testCaseRepository.findById(rqUID, questionId, testCaseId);

		if (!existingTestCase) {
			debug('[%s] Test case not found: %s', rqUID, testCaseId);

			throw new AppError(404, 'TEST_CASE_NOT_FOUND', 'Test case not found');
		}
		const existingDisplayOrder = await testCaseRepository.findByDisplayOrder(
			rqUID,
			questionId,
			data.displayOrder,
			testCaseId
		);

		if (existingDisplayOrder) {
			debug(
				'[%s] Test case display order already exists. Question: %s Order: %d',
				rqUID,
				questionId,
				data.displayOrder
			);

			throw new AppError(
				409,
				'TEST_CASE_DISPLAY_ORDER_ALREADY_EXISTS',
				'A test case with this display order already exists'
			);
		}
		const testCase = await testCaseRepository.update(rqUID, questionId, testCaseId, data);
		debug('[%s] Test case updated successfully: %s', rqUID, testCaseId);
		return testCase;
	}

	public async delete(
		rqUID: string,
		assessmentId: string,
		questionId: string,
		testCaseId: string
	): Promise<void> {
		debug('[%s] Deleting test case: %s', rqUID, testCaseId);
		const assessment = await assessmentRepository.findById(rqUID, assessmentId);

		if (!assessment) {
			debug('[%s] Assessment not found: %s', rqUID, assessmentId);

			throw new AppError(404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
		}

		if (assessment.status !== 'DRAFT') {
			debug(
				'[%s] Test case cannot be deleted. Assessment: %s Status: %s',
				rqUID,
				assessmentId,
				assessment.status
			);

			throw new AppError(
				409,
				'ASSESSMENT_NOT_EDITABLE',
				'Test cases can only be deleted from DRAFT assessments'
			);
		}
		const question = await questionRepository.findById(rqUID, assessmentId, questionId);

		if (!question) {
			debug('[%s] Question not found: %s', rqUID, questionId);

			throw new AppError(404, 'QUESTION_NOT_FOUND', 'Question not found');
		}
		const existingTestCase = await testCaseRepository.findById(rqUID, questionId, testCaseId);

		if (!existingTestCase) {
			debug('[%s] Test case not found: %s', rqUID, testCaseId);

			throw new AppError(404, 'TEST_CASE_NOT_FOUND', 'Test case not found');
		}
		await testCaseRepository.delete(rqUID, questionId, testCaseId);
		debug('[%s] Test case deleted successfully: %s', rqUID, testCaseId);
	}
}

export default new TestCaseService();
