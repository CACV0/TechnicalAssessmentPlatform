import debugLib from 'debug';
import AppError from '../../../generic/error';
import assessmentSessionRepository from '../../assessmentSession/repository/assessmentSessionRepository';
import programmingLanguageRepository from '../../programmingLanguage/repository/programmingLanguageRepository';
import questionLanguageRepository from '../../programmingLanguage/repository/questionLanguageRepository';
import questionRepository from '../../question/repository/questionRepository';
import runnerFactory from '../../runner/runner/runnerFactory';
import { PreparedExecution } from '../../runner/types/runnerTypes';
import testCaseEvaluator from '../../runner/service/testCaseEvaluator';
import testCaseRepository from '../../testCase/repository/testCaseRepository';
import { RunCodeInput, RunCodeResult, RunTestCaseResult } from '../types/evaluationTypes';

const debug = debugLib('platform:RunCodeService');

const EXECUTION_TIMEOUT_MS = 5000;

class RunCodeService {
	public async run(
		rqUID: string,
		sessionId: string,
		questionId: string,
		data: RunCodeInput
	): Promise<RunCodeResult> {
		debug('[%s] Running code. Session: %s Question: %s', rqUID, sessionId, questionId);
		const session = await assessmentSessionRepository.findById(rqUID, sessionId);
		if (!session) {
			throw new AppError(404, 'ASSESSMENT_SESSION_NOT_FOUND', 'Assessment session not found');
		}

		if (session.status !== 'IN_PROGRESS') {
			throw new AppError(409, 'ASSESSMENT_SESSION_NOT_ACTIVE', 'Assessment session is not active');
		}

		if (new Date().getTime() >= session.expiresAt.getTime()) {
			await assessmentSessionRepository.updateStatus(rqUID, sessionId, 'EXPIRED');
			throw new AppError(409, 'ASSESSMENT_SESSION_EXPIRED', 'Assessment session has expired');
		}
		const question = await questionRepository.findById(rqUID, session.assessmentId, questionId);

		if (!question) {
			throw new AppError(404, 'QUESTION_NOT_FOUND', 'Question not found');
		}
		const programmingLanguage = await programmingLanguageRepository.findById(
			rqUID,
			data.programmingLanguageId
		);

		if (!programmingLanguage) {
			throw new AppError(404, 'PROGRAMMING_LANGUAGE_NOT_FOUND', 'Programming language not found');
		}

		if (!programmingLanguage.isActive) {
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
			throw new AppError(
				409,
				'PROGRAMMING_LANGUAGE_NOT_ALLOWED',
				'Programming language is not allowed for this question'
			);
		}

		const runner = runnerFactory.getRunner(programmingLanguage.code);

		if (!runner) {
			throw new AppError(
				409,
				'PROGRAMMING_LANGUAGE_RUNNER_NOT_SUPPORTED',
				'Programming language runner is not supported'
			);
		}

		const testCases = await testCaseRepository.findAllByQuestionId(rqUID, questionId);
		const publicTestCases = testCases.filter((testCase) => testCase.visibility === 'PUBLIC');

		if (publicTestCases.length === 0) {
			throw new AppError(
				409,
				'PUBLIC_TEST_CASES_NOT_CONFIGURED',
				'No public test cases are configured for this question'
			);
		}

		let preparedExecution: PreparedExecution | null = null;

		try {
			const prepareResult = await runner.prepare(rqUID, {
				languageCode: programmingLanguage.code,
				sourceCode: data.sourceCode,
			});
			if (prepareResult.result.status === 'COMPILE_ERROR') {
				debug('[%s] Run completed with compilation error. Question: %s', rqUID, questionId);
				return {
					status: 'COMPILE_ERROR',
					compileError: prepareResult.result.stderr || 'Compilation error',
					results: [],
				};
			}

			if (!prepareResult.execution) {
				throw new Error(`Execution was not prepared for question: ${questionId}`);
			}

			preparedExecution = prepareResult.execution;
			const results: RunTestCaseResult[] = [];
			for (const testCase of publicTestCases) {
				const runnerResult = await runner.execute(rqUID, preparedExecution, {
					stdin: testCase.input,
					timeoutMs: EXECUTION_TIMEOUT_MS,
				});
				const evaluatedResult = testCaseEvaluator.evaluate('RUN', testCase, runnerResult);
				results.push({
					testCaseId: testCase.id,
					status: evaluatedResult.status,
					input: testCase.input,
					actualOutput: evaluatedResult.actualOutput ?? null,
					errorMessage: evaluatedResult.errorMessage ?? null,
					executionTimeMs: evaluatedResult.executionTimeMs ?? null,
				});
			}
			debug(
				'[%s] Code run completed. Question: %s Public test cases: %d',
				rqUID,
				questionId,
				results.length
			);
			return {
				status: 'COMPLETED',
				compileError: null,
				results,
			};
		} finally {
			if (preparedExecution) {
				await runner.dispose(rqUID, preparedExecution);
			}
		}
	}
}

export default new RunCodeService();
