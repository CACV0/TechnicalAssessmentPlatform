import { TestCase } from '../../testCase/types/testCaseTypes';
import { CreateTestCaseResultInput } from '../../testCaseResult/types/testCaseResultTypes';
import { RunnerResult } from '../types/runnerTypes';

class TestCaseEvaluator {
	public evaluate(
		submissionId: string,
		testCase: TestCase,
		runnerResult: RunnerResult
	): CreateTestCaseResultInput {
		switch (runnerResult.status) {
			case 'SUCCESS':
				return this.evaluateOutput(submissionId, testCase, runnerResult);

			case 'RUNTIME_ERROR':
				return {
					submissionId,
					testCaseId: testCase.id,
					status: 'ERROR',
					actualOutput: runnerResult.stdout || null,
					errorMessage: runnerResult.stderr || null,
					executionTimeMs: runnerResult.executionTimeMs,
				};

			case 'TIMEOUT':
				return {
					submissionId,
					testCaseId: testCase.id,
					status: 'TIMEOUT',
					actualOutput: runnerResult.stdout || null,
					errorMessage: runnerResult.stderr || null,
					executionTimeMs: runnerResult.executionTimeMs,
				};

			case 'COMPILE_ERROR':
				throw new Error('Compile errors cannot be evaluated as individual test case results');

			default:
				return this.assertNever(runnerResult.status);
		}
	}

	private evaluateOutput(
		submissionId: string,
		testCase: TestCase,
		runnerResult: RunnerResult
	): CreateTestCaseResultInput {
		const actualOutput = runnerResult.stdout;
		const passed =
			this.normalizeOutput(actualOutput) === this.normalizeOutput(testCase.expectedOutput);
		return {
			submissionId,
			testCaseId: testCase.id,
			status: passed ? 'PASSED' : 'FAILED',
			actualOutput,
			errorMessage: runnerResult.stderr || null,
			executionTimeMs: runnerResult.executionTimeMs,
		};
	}

	private normalizeOutput(output: string): string {
		return output.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trimEnd();
	}

	private assertNever(value: never): never {
		throw new Error(`Unsupported runner status: ${String(value)}`);
	}
}

export default new TestCaseEvaluator();
