import debugLib from 'debug';
import pool from '../../../database/postgres';
import {
	CreateTestCaseRequest,
	TestCase,
	TestCaseVisibility,
	UpdateTestCaseRequest,
} from '../types/testCaseTypes';

const debug = debugLib('platform:TestCaseRepository');

interface TestCaseRow {
	id: string;
	question_id: string;
	input: string | null;
	expected_output: string;
	visibility: TestCaseVisibility;
	display_order: number;
	created_at: Date;
}

class TestCaseRepository {
	public async create(
		rqUID: string,
		questionId: string,
		data: CreateTestCaseRequest
	): Promise<TestCase> {
		debug('[%s] Creating test case for question: %s', rqUID, questionId);
		const query = `
			INSERT INTO test_case (
				question_id,
				input,
				expected_output,
				visibility,
				display_order
			)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING
				id,
				question_id,
				input,
				expected_output,
				visibility,
				display_order,
				created_at;
		`;
		const values = [
			questionId,
			data.input ?? null,
			data.expectedOutput,
			data.visibility,
			data.displayOrder,
		];
		const result = await pool.query<TestCaseRow>(query, values);
		const testCase = this.mapRow(result.rows[0]);
		debug('[%s] Test case created: %s', rqUID, testCase.id);
		return testCase;
	}

	public async findAllByQuestionId(rqUID: string, questionId: string): Promise<TestCase[]> {
		debug('[%s] Finding test cases for question: %s', rqUID, questionId);
		const query = `
			SELECT
				id,
				question_id,
				input,
				expected_output,
				visibility,
				display_order,
				created_at
			FROM test_case
			WHERE question_id = $1
			ORDER BY display_order ASC;
		`;
		const result = await pool.query<TestCaseRow>(query, [questionId]);
		const testCases = result.rows.map((row) => this.mapRow(row));
		debug('[%s] Test cases found for question %s: %d', rqUID, questionId, testCases.length);
		return testCases;
	}

	public async findById(
		rqUID: string,
		questionId: string,
		testCaseId: string
	): Promise<TestCase | null> {
		debug('[%s] Finding test case: %s', rqUID, testCaseId);
		const query = `
			SELECT
				id,
				question_id,
				input,
				expected_output,
				visibility,
				display_order,
				created_at
			FROM test_case
			WHERE id = $1
			AND question_id = $2;
		`;
		const result = await pool.query<TestCaseRow>(query, [testCaseId, questionId]);

		if (result.rows.length === 0) {
			debug('[%s] Test case not found: %s', rqUID, testCaseId);
			return null;
		}

		return this.mapRow(result.rows[0]);
	}

	public async findByDisplayOrder(
		rqUID: string,
		questionId: string,
		displayOrder: number,
		excludeTestCaseId?: string
	): Promise<TestCase | null> {
		debug(
			'[%s] Finding test case by display order. Question: %s Order: %d',
			rqUID,
			questionId,
			displayOrder
		);
		const query = `
			SELECT
				id,
				question_id,
				input,
				expected_output,
				visibility,
				display_order,
				created_at
			FROM test_case
			WHERE question_id = $1
			AND display_order = $2
			AND ($3::uuid IS NULL OR id <> $3);
		`;
		const result = await pool.query<TestCaseRow>(query, [
			questionId,
			displayOrder,
			excludeTestCaseId ?? null,
		]);

		if (result.rows.length === 0) {
			return null;
		}

		return this.mapRow(result.rows[0]);
	}

	public async update(
		rqUID: string,
		questionId: string,
		testCaseId: string,
		data: UpdateTestCaseRequest
	): Promise<TestCase> {
		debug('[%s] Updating test case: %s', rqUID, testCaseId);
		const query = `
			UPDATE test_case
			SET
				input = $3,
				expected_output = $4,
				visibility = $5,
				display_order = $6
			WHERE id = $1
			AND question_id = $2
			RETURNING
				id,
				question_id,
				input,
				expected_output,
				visibility,
				display_order,
				created_at;
		`;

		const values = [
			testCaseId,
			questionId,
			data.input ?? null,
			data.expectedOutput,
			data.visibility,
			data.displayOrder,
		];

		const result = await pool.query<TestCaseRow>(query, values);
		const testCase = this.mapRow(result.rows[0]);
		debug('[%s] Test case updated: %s', rqUID, testCaseId);
		return testCase;
	}

	public async delete(rqUID: string, questionId: string, testCaseId: string): Promise<boolean> {
		debug('[%s] Deleting test case: %s', rqUID, testCaseId);
		const query = `
			DELETE FROM test_case
			WHERE id = $1
			AND question_id = $2;
		`;

		const result = await pool.query(query, [testCaseId, questionId]);
		const deleted = (result.rowCount ?? 0) > 0;
		debug('[%s] Test case deleted: %s Result: %s', rqUID, testCaseId, deleted);
		return deleted;
	}

	private mapRow(row: TestCaseRow): TestCase {
		return {
			id: row.id,
			questionId: row.question_id,
			input: row.input,
			expectedOutput: row.expected_output,
			visibility: row.visibility,
			displayOrder: row.display_order,
			createdAt: row.created_at,
		};
	}
}

export default new TestCaseRepository();
