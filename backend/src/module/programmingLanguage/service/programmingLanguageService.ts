import debugLib from 'debug';
import assessmentRepository from '../../assessment/repository/assessmentRepository';
import questionRepository from '../../question/repository/questionRepository';
import programmingLanguageRepository from '../repository/programmingLanguageRepository';
import questionLanguageRepository from '../repository/questionLanguageRepository';
import {
	ProgrammingLanguage,
	UpdateQuestionLanguagesRequest,
} from '../types/programmingLanguageTypes';
import AppError from '../../../generic/error';

const debug = debugLib('platform:ProgrammingLanguageService');

class ProgrammingLanguageService {
	public async findAllActive(rqUID: string): Promise<ProgrammingLanguage[]> {
		debug('[%s] Getting active programming languages', rqUID);
		const programmingLanguages = await programmingLanguageRepository.findAllActive(rqUID);
		debug('[%s] Active programming languages retrieved: %d', rqUID, programmingLanguages.length);
		return programmingLanguages;
	}

	public async findByQuestionId(
		rqUID: string,
		assessmentId: string,
		questionId: string
	): Promise<ProgrammingLanguage[]> {
		debug('[%s] Getting languages for question: %s', rqUID, questionId);
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

		const programmingLanguages = await questionLanguageRepository.findByQuestionId(
			rqUID,
			questionId
		);
		debug(
			'[%s] Languages retrieved for question %s: %d',
			rqUID,
			questionId,
			programmingLanguages.length
		);
		return programmingLanguages;
	}

	public async updateQuestionLanguages(
		rqUID: string,
		assessmentId: string,
		questionId: string,
		data: UpdateQuestionLanguagesRequest
	): Promise<ProgrammingLanguage[]> {
		debug('[%s] Updating languages for question: %s', rqUID, questionId);
		const assessment = await assessmentRepository.findById(rqUID, assessmentId);

		if (!assessment) {
			debug('[%s] Assessment not found: %s', rqUID, assessmentId);

			throw new AppError(404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
		}

		if (assessment.status !== 'DRAFT') {
			debug(
				'[%s] Question languages cannot be updated. Assessment: %s Status: %s',
				rqUID,
				assessmentId,
				assessment.status
			);

			throw new AppError(
				409,
				'ASSESSMENT_NOT_EDITABLE',
				'Question languages can only be updated for DRAFT assessments'
			);
		}

		const question = await questionRepository.findById(rqUID, assessmentId, questionId);

		if (!question) {
			debug('[%s] Question not found: %s', rqUID, questionId);

			throw new AppError(404, 'QUESTION_NOT_FOUND', 'Question not found');
		}

		const programmingLanguages = await programmingLanguageRepository.findByIds(
			rqUID,
			data.languageIds
		);

		if (programmingLanguages.length !== data.languageIds.length) {
			debug('[%s] One or more programming languages were not found', rqUID);

			throw new AppError(
				404,
				'PROGRAMMING_LANGUAGE_NOT_FOUND',
				'One or more programming languages were not found'
			);
		}

		const inactiveProgrammingLanguage = programmingLanguages.find(
			(programmingLanguage) => !programmingLanguage.isActive
		);

		if (inactiveProgrammingLanguage) {
			debug('[%s] Programming language is not active: %s', rqUID, inactiveProgrammingLanguage.id);

			throw new AppError(
				409,
				'PROGRAMMING_LANGUAGE_NOT_ACTIVE',
				'One or more programming languages are not active'
			);
		}

		await questionLanguageRepository.replace(rqUID, questionId, data.languageIds);
		const updatedProgrammingLanguages = await questionLanguageRepository.findByQuestionId(
			rqUID,
			questionId
		);
		debug('[%s] Languages updated successfully for question: %s', rqUID, questionId);
		return updatedProgrammingLanguages;
	}
}

export default new ProgrammingLanguageService();
