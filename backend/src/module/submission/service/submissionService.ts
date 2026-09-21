import debugLib from 'debug';
import AppError from '../../../generic/error';
import assessmentSessionRepository from '../../assessmentSession/repository/assessmentSessionRepository';
import questionRepository from '../../question/repository/questionRepository';
import programmingLanguageRepository from '../../programmingLanguage/repository/programmingLanguageRepository';
import questionLanguageRepository from '../../programmingLanguage/repository/questionLanguageRepository';
import submissionRepository from '../repository/submissionRepository';
import { CreateSubmissionInput, Submission, SubmissionResult } from '../types/submissionTypes';
import testCaseResultRepository from '../../testCaseResult/repository/testCaseResultRepository';

const debug = debugLib('platform:SubmissionService');

class SubmissionService {
	public async create(
		rqUID: string,
		sessionId: string,
		questionId: string,
		data: CreateSubmissionInput
	): Promise<Submission> {
		debug('[%s] Creating submission. Session: %s Question: %s', rqUID, sessionId, questionId);
		const session = await assessmentSessionRepository.findById(rqUID, sessionId);

		if (!session) {
			debug('[%s] Assessment session not found: %s', rqUID, sessionId);
			throw new AppError(404, 'ASSESSMENT_SESSION_NOT_FOUND', 'Assessment session not found');
		}

		if (session.status !== 'IN_PROGRESS') {
			debug(
				'[%s] Assessment session is not active. ID: %s Status: %s',
				rqUID,
				sessionId,
				session.status
			);
			throw new AppError(409, 'ASSESSMENT_SESSION_NOT_ACTIVE', 'Assessment session is not active');
		}

		if (new Date().getTime() >= session.expiresAt.getTime()) {
			debug('[%s] Assessment session expired: %s', rqUID, sessionId);
			await assessmentSessionRepository.updateStatus(rqUID, sessionId, 'EXPIRED');
			throw new AppError(409, 'ASSESSMENT_SESSION_EXPIRED', 'Assessment session has expired');
		}
		const question = await questionRepository.findById(rqUID, session.assessmentId, questionId);

		if (!question) {
			debug(
				'[%s] Question not found in session assessment. Assessment: %s Question: %s',
				rqUID,
				session.assessmentId,
				questionId
			);
			throw new AppError(404, 'QUESTION_NOT_FOUND', 'Question not found');
		}
		const programmingLanguages = await programmingLanguageRepository.findByIds(rqUID, [
			data.programmingLanguageId,
		]);

		if (programmingLanguages.length === 0) {
			debug('[%s] Programming language not found: %s', rqUID, data.programmingLanguageId);
			throw new AppError(404, 'PROGRAMMING_LANGUAGE_NOT_FOUND', 'Programming language not found');
		}
		const programmingLanguage = programmingLanguages[0];

		if (!programmingLanguage.isActive) {
			debug('[%s] Programming language is not active: %s', rqUID, data.programmingLanguageId);
			throw new AppError(
				409,
				'PROGRAMMING_LANGUAGE_NOT_ACTIVE',
				'Programming language is not active'
			);
		}

		const allowedLanguages = await questionLanguageRepository.findByQuestionId(rqUID, questionId);
		const languageAllowed = allowedLanguages.some(
			(language) => language.id === data.programmingLanguageId
		);

		if (!languageAllowed) {
			debug(
				'[%s] Programming language is not allowed for question. Question: %s Language: %s',
				rqUID,
				questionId,
				data.programmingLanguageId
			);
			throw new AppError(
				409,
				'PROGRAMMING_LANGUAGE_NOT_ALLOWED',
				'Programming language is not allowed for this question'
			);
		}
		const submission = await submissionRepository.create(rqUID, sessionId, questionId, data);
		debug(
			'[%s] Submission created successfully: %s Attempt: %d',
			rqUID,
			submission.id,
			submission.attemptNumber
		);
		return submission;
	}

	public async findById(rqUID: string, id: string): Promise<Submission> {
		debug('[%s] Getting submission: %s', rqUID, id);
		const submission = await submissionRepository.findById(rqUID, id);

		if (!submission) {
			debug('[%s] Submission not found: %s', rqUID, id);
			throw new AppError(404, 'SUBMISSION_NOT_FOUND', 'Submission not found');
		}
		return submission;
	}

	public async findResult(rqUID: string, submissionId: string): Promise<SubmissionResult> {
		debug('[%s] Getting submission result: %s', rqUID, submissionId);
		const submission = await this.findById(rqUID, submissionId);
		const testCaseResults = await testCaseResultRepository.findBySubmissionId(rqUID, submissionId);
		const results = testCaseResults.map((result) => {
			if (result.visibility === 'HIDDEN') {
				return {
					testCaseId: null,
					visibility: result.visibility,
					status: result.status,
					actualOutput: null,
					errorMessage: null,
					executionTimeMs: null,
				};
			}
			return {
				testCaseId: result.testCaseId,
				visibility: result.visibility,
				status: result.status,
				actualOutput: result.actualOutput,
				errorMessage: result.errorMessage,
				executionTimeMs: result.executionTimeMs,
			};
		});
		debug(
			'[%s] Submission result retrieved. Submission: %s Results: %d',
			rqUID,
			submissionId,
			results.length
		);
		return {
			submissionId: submission.id,
			status: submission.status,
			score: submission.score,
			errorMessage: submission.errorMessage,
			results,
		};
	}

	public async findBySessionAndQuestion(
		rqUID: string,
		sessionId: string,
		questionId: string
	): Promise<Submission[]> {
		debug('[%s] Getting submissions. Session: %s Question: %s', rqUID, sessionId, questionId);
		const session = await assessmentSessionRepository.findById(rqUID, sessionId);
		if (!session) {
			debug('[%s] Assessment session not found: %s', rqUID, sessionId);
			throw new AppError(404, 'ASSESSMENT_SESSION_NOT_FOUND', 'Assessment session not found');
		}
		const question = await questionRepository.findById(rqUID, session.assessmentId, questionId);

		if (!question) {
			debug(
				'[%s] Question not found in session assessment. Assessment: %s Question: %s',
				rqUID,
				session.assessmentId,
				questionId
			);
			throw new AppError(404, 'QUESTION_NOT_FOUND', 'Question not found');
		}
		const submissions = await submissionRepository.findBySessionAndQuestion(
			rqUID,
			sessionId,
			questionId
		);
		debug(
			'[%s] Submissions retrieved. Session: %s Question: %s Count: %d',
			rqUID,
			sessionId,
			questionId,
			submissions.length
		);
		return submissions;
	}
}

export default new SubmissionService();
