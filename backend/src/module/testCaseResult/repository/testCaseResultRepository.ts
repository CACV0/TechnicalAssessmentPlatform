import debugLib from 'debug';
import pool from '../../../database/postgres';
import {
	CreateTestCaseResultInput,
	TestCaseResult,
	TestCaseResultDetail,
	TestCaseResultStatus,
	TestCaseResultVisibility,
} from '../types/testCaseResultTypes';

const debug = debugLib('platform:TestCaseResultRepository');

interface TestCaseResultRow {
	submission_id: string;
	test_case_id: string;
	status: TestCaseResultStatus;
	actual_output: string | null;
	error_message: string | null;
	execution_time_ms: number | null;
}

interface TestCaseResultDetailRow extends TestCaseResultRow {
	visibility: TestCaseResultVisibility;
}

class TestCaseResultRepository {
	public async create(rqUID: string, data: CreateTestCaseResultInput): Promise<TestCaseResult> {
		debug(
			'[%s] Creating test case result. Submission: %s TestCase: %s',
			rqUID,
			data.submissionId,
			data.testCaseId
		);
		const query = `
			INSERT INTO test_case_result (
				submission_id,
				test_case_id,
				status,
				actual_output,
				error_message,
				execution_time_ms
			)
			VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING
				submission_id,
				test_case_id,
				status,
				actual_output,
				error_message,
				execution_time_ms;
		`;
		const values = [
			data.submissionId,
			data.testCaseId,
			data.status,
			data.actualOutput ?? null,
			data.errorMessage ?? null,
			data.executionTimeMs ?? null,
		];
		const result = await pool.query<TestCaseResultRow>(query, values);
		const testCaseResult = this.mapRow(result.rows[0]);
		debug(
			'[%s] Test case result created. Submission: %s TestCase: %s Status: %s',
			rqUID,
			testCaseResult.submissionId,
			testCaseResult.testCaseId,
			testCaseResult.status
		);
		return testCaseResult;
	}

	public async findBySubmissionId(
		rqUID: string,
		submissionId: string
	): Promise<TestCaseResultDetail[]> {
		debug('[%s] Finding test case results. Submission: %s', rqUID, submissionId);
		const query = `
			SELECT
				tcr.submission_id,
				tcr.test_case_id,
				tcr.status,
				tcr.actual_output,
				tcr.error_message,
				tcr.execution_time_ms,
				tc.visibility
			FROM test_case_result tcr
			INNER JOIN test_case tc
				ON tc.id = tcr.test_case_id
			WHERE tcr.submission_id = $1
			ORDER BY tc.display_order ASC;
		`;
		const result = await pool.query<TestCaseResultDetailRow>(query, [submissionId]);
		const testCaseResults = result.rows.map((row) => this.mapDetailRow(row));
		debug(
			'[%s] Test case results found. Submission: %s Count: %d',
			rqUID,
			submissionId,
			testCaseResults.length
		);
		return testCaseResults;
	}

	private mapRow(row: TestCaseResultRow): TestCaseResult {
		return {
			submissionId: row.submission_id,
			testCaseId: row.test_case_id,
			status: row.status,
			actualOutput: row.actual_output,
			errorMessage: row.error_message,
			executionTimeMs: row.execution_time_ms,
		};
	}

	private mapDetailRow(row: TestCaseResultDetailRow): TestCaseResultDetail {
		return {
			...this.mapRow(row),
			visibility: row.visibility,
		};
	}
}

export default new TestCaseResultRepository();
