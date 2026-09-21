import debugLib from 'debug';

import questionRepository from '../repository/questionRepository';
import assessmentRepository from '../../assessment/repository/assessmentRepository';
import { Question, CreateQuestionRequest, UpdateQuestionRequest } from '../types/questionTypes';

import AppError from '../../../generic/error';

const debug = debugLib('platform:QuestionService');

class QuestionService {
	public async create(
		rqUID: string,
		assessmentId: string,
		data: CreateQuestionRequest
	): Promise<Question> {
		debug('[%s] Creating question for assessment: %s', rqUID, assessmentId);
		const assessment = await assessmentRepository.findById(rqUID, assessmentId);

		if (!assessment) {
			debug('[%s] Assessment not found: %s', rqUID, assessmentId);
			throw new AppError(404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
		}

		if (assessment.status !== 'DRAFT') {
			debug(
				'[%s] Question cannot be created. Assessment: %s Status: %s',
				rqUID,
				assessmentId,
				assessment.status
			);

			throw new AppError(
				409,
				'ASSESSMENT_NOT_EDITABLE',
				'Questions can only be created for DRAFT assessments'
			);
		}

		const existingDisplayOrder = await questionRepository.findByDisplayOrder(
			rqUID,
			assessmentId,
			data.displayOrder
		);

		if (existingDisplayOrder) {
			debug(
				'[%s] Display order already exists. Assessment: %s Order: %d',
				rqUID,
				assessmentId,
				data.displayOrder
			);

			throw new AppError(
				409,
				'QUESTION_DISPLAY_ORDER_ALREADY_EXISTS',
				'A question with this display order already exists'
			);
		}

		const question = await questionRepository.create(rqUID, assessmentId, data);
		debug('[%s] Question created successfully: %s', rqUID, question.id);
		return question;
	}

	public async findAllByAssessmentId(rqUID: string, assessmentId: string): Promise<Question[]> {
		debug('[%s] Getting questions for assessment: %s', rqUID, assessmentId);
		const assessment = await assessmentRepository.findById(rqUID, assessmentId);

		if (!assessment) {
			debug('[%s] Assessment not found: %s', rqUID, assessmentId);
			throw new AppError(404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
		}

		const questions = await questionRepository.findAllByAssessmentId(rqUID, assessmentId);
		debug('[%s] Questions retrieved: %d', rqUID, questions.length);
		return questions;
	}

	public async findById(
		rqUID: string,
		assessmentId: string,
		questionId: string
	): Promise<Question> {
		debug('[%s] Getting question: %s', rqUID, questionId);
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
		return question;
	}

	public async update(
		rqUID: string,
		assessmentId: string,
		questionId: string,
		data: UpdateQuestionRequest
	): Promise<Question> {
		debug('[%s] Updating question: %s', rqUID, questionId);
		const assessment = await assessmentRepository.findById(rqUID, assessmentId);

		if (!assessment) {
			debug('[%s] Assessment not found: %s', rqUID, assessmentId);
			throw new AppError(404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
		}

		if (assessment.status !== 'DRAFT') {
			debug(
				'[%s] Question cannot be updated. Assessment: %s Status: %s',
				rqUID,
				assessmentId,
				assessment.status
			);

			throw new AppError(
				409,
				'ASSESSMENT_NOT_EDITABLE',
				'Questions can only be updated for DRAFT assessments'
			);
		}
		const existingQuestion = await questionRepository.findById(rqUID, assessmentId, questionId);

		if (!existingQuestion) {
			debug('[%s] Question not found: %s', rqUID, questionId);
			throw new AppError(404, 'QUESTION_NOT_FOUND', 'Question not found');
		}

		const existingDisplayOrder = await questionRepository.findByDisplayOrder(
			rqUID,
			assessmentId,
			data.displayOrder,
			questionId
		);

		if (existingDisplayOrder) {
			debug(
				'[%s] Display order already exists. Assessment: %s Order: %d',
				rqUID,
				assessmentId,
				data.displayOrder
			);

			throw new AppError(
				409,
				'QUESTION_DISPLAY_ORDER_ALREADY_EXISTS',
				'A question with this display order already exists'
			);
		}

		const question = await questionRepository.update(rqUID, assessmentId, questionId, data);
		debug('[%s] Question updated successfully: %s', rqUID, questionId);
		return question;
	}

	public async delete(rqUID: string, assessmentId: string, questionId: string): Promise<void> {
		debug('[%s] Deleting question: %s', rqUID, questionId);
		const assessment = await assessmentRepository.findById(rqUID, assessmentId);
		if (!assessment) {
			debug('[%s] Assessment not found: %s', rqUID, assessmentId);
			throw new AppError(404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
		}

		if (assessment.status !== 'DRAFT') {
			debug(
				'[%s] Question cannot be deleted. Assessment: %s Status: %s',
				rqUID,
				assessmentId,
				assessment.status
			);
			throw new AppError(
				409,
				'ASSESSMENT_NOT_EDITABLE',
				'Questions can only be deleted from DRAFT assessments'
			);
		}
		const existingQuestion = await questionRepository.findById(rqUID, assessmentId, questionId);

		if (!existingQuestion) {
			debug('[%s] Question not found: %s', rqUID, questionId);
			throw new AppError(404, 'QUESTION_NOT_FOUND', 'Question not found');
		}

		await questionRepository.delete(rqUID, assessmentId, questionId);
		debug('[%s] Question deleted successfully: %s', rqUID, questionId);
	}
}

export default new QuestionService();
