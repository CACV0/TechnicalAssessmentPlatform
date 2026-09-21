import debugLib from 'debug';
import assessmentSessionRepository from '../../assessmentSession/repository/assessmentSessionRepository';
import questionRepository from '../../question/repository/questionRepository';
import javaRunner, { PreparedJavaExecution } from '../../runner/runner/javaRunner';
import testCaseEvaluator from '../../runner/service/testCaseEvaluator';
import submissionRepository from '../../submission/repository/submissionRepository';
import { Submission } from '../../submission/types/submissionTypes';
import testCaseRepository from '../../testCase/repository/testCaseRepository';
import testCaseResultRepository from '../../testCaseResult/repository/testCaseResultRepository';
import programmingLanguageRepository from '../../programmingLanguage/repository/programmingLanguageRepository';

const debug = debugLib('platform:EvaluationService');

const EXECUTION_TIMEOUT_MS = 2000;

class EvaluationService {
	public async evaluate(rqUID: string, submissionId: string): Promise<Submission> {
		debug('[%s] Starting submission evaluation: %s', rqUID, submissionId);
		const submission = await submissionRepository.findById(rqUID, submissionId);

		if (!submission) {
			throw new Error(`Submission not found: ${submissionId}`);
		}

		if (submission.status !== 'PENDING') {
			throw new Error(`Submission ${submissionId} is not pending`);
		}

		let preparedExecution: PreparedJavaExecution | null = null;

		try {
			const session = await assessmentSessionRepository.findById(
				rqUID,
				submission.assessmentSessionId
			);

			if (!session) {
				throw new Error(`Assessment session not found: ${submission.assessmentSessionId}`);
			}

			const question = await questionRepository.findById(
				rqUID,
				session.assessmentId,
				submission.questionId
			);

			if (!question) {
				throw new Error(`Question not found: ${submission.questionId}`);
			}

			const testCases = await testCaseRepository.findAllByQuestionId(rqUID, submission.questionId);

			if (testCases.length === 0) {
				throw new Error(`No test cases configured for question: ${submission.questionId}`);
			}

			const programmingLanguage = await programmingLanguageRepository.findById(
				rqUID,
				submission.programmingLanguageId
			);

			if (!programmingLanguage) {
				throw new Error(`Programming language not found: ${submission.programmingLanguageId}`);
			}

			if (!programmingLanguage.isActive) {
				throw new Error(`Programming language is not active: ${programmingLanguage.code}`);
			}

			if (programmingLanguage.code.toLowerCase() !== 'java') {
				throw new Error(`Programming language runner not supported: ${programmingLanguage.code}`);
			}

			const prepareResult = await javaRunner.prepare(rqUID, {
				languageCode: programmingLanguage.code,
				sourceCode: submission.sourceCode,
			});

			if (prepareResult.result.status === 'COMPILE_ERROR') {
				const evaluatedSubmission = await submissionRepository.markAsEvaluated(
					rqUID,
					submission.id,
					0,
					prepareResult.result.stderr || 'Compilation error'
				);

				if (!evaluatedSubmission) {
					throw new Error(`Unable to mark submission as evaluated: ${submission.id}`);
				}

				debug(
					'[%s] Submission evaluation completed with compilation error: %s',
					rqUID,
					submission.id
				);

				return evaluatedSubmission;
			}

			if (!prepareResult.execution) {
				throw new Error(`Java execution was not prepared for submission: ${submission.id}`);
			}

			preparedExecution = prepareResult.execution;

			let passedTestCases = 0;

			for (const testCase of testCases) {
				const runnerResult = await javaRunner.execute(rqUID, preparedExecution, {
					stdin: testCase.input,
					timeoutMs: EXECUTION_TIMEOUT_MS,
				});
				const testCaseResult = testCaseEvaluator.evaluate(submission.id, testCase, runnerResult);
				await testCaseResultRepository.create(rqUID, testCaseResult);

				if (testCaseResult.status === 'PASSED') {
					passedTestCases++;
				}
			}

			const score = this.calculateScore(passedTestCases, testCases.length, question.score);

			const evaluatedSubmission = await submissionRepository.markAsEvaluated(
				rqUID,
				submission.id,
				score
			);

			if (!evaluatedSubmission) {
				throw new Error(`Unable to mark submission as evaluated: ${submission.id}`);
			}

			debug('[%s] Submission evaluated successfully: %s Score: %d', rqUID, submission.id, score);

			return evaluatedSubmission;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown evaluation error';
			debug('[%s] Submission evaluation failed: %s Error: %s', rqUID, submission.id, errorMessage);
			await submissionRepository.markAsFailed(rqUID, submission.id, errorMessage);

			throw error;
		} finally {
			if (preparedExecution) {
				await javaRunner.dispose(rqUID, preparedExecution);
			}
		}
	}

	private calculateScore(
		passedTestCases: number,
		totalTestCases: number,
		questionScore: number
	): number {
		const score = (passedTestCases / totalTestCases) * questionScore;
		return Math.round(score * 100) / 100;
	}
}

export default new EvaluationService();
