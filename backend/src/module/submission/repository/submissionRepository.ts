import debugLib from 'debug';
import pool from '../../../database/postgres';
import { Submission, SubmissionStatus, CreateSubmissionInput } from '../types/submissionTypes';

const debug = debugLib('platform:SubmissionRepository');

interface SubmissionRow {
	id: string;
	assessment_session_id: string;
	question_id: string;
	programming_language_id: string;
	attempt_number: number;
	source_code: string;
	status: SubmissionStatus;
	score: string | null;
	error_message: string | null;
	submitted_at: Date;
}

class SubmissionRepository {
	public async create(
		rqUID: string,
		assessmentSessionId: string,
		questionId: string,
		data: CreateSubmissionInput
	): Promise<Submission> {
		debug(
			'[%s] Creating submission. Session: %s Question: %s',
			rqUID,
			assessmentSessionId,
			questionId
		);
		const client = await pool.connect();
		try {
			await client.query('BEGIN');
			await client.query(
				`
					SELECT id
					FROM assessment_session
					WHERE id = $1
					FOR UPDATE;
				`,
				[assessmentSessionId]
			);
			const attemptResult = await client.query<{ attempt_number: number }>(
				`
					SELECT
						COALESCE(MAX(attempt_number), 0) + 1 AS attempt_number
					FROM submission
					WHERE assessment_session_id = $1
						AND question_id = $2;
				`,
				[assessmentSessionId, questionId]
			);
			const attemptNumber = attemptResult.rows[0].attempt_number;
			const query = `
				INSERT INTO submission (
					assessment_session_id,
					question_id,
					programming_language_id,
					attempt_number,
					source_code
				)
				VALUES ($1, $2, $3, $4, $5)
				RETURNING
					id,
					assessment_session_id,
					question_id,
					programming_language_id,
					attempt_number,
					source_code,
					status,
					score,
					error_message,
					submitted_at;
			`;
			const values = [
				assessmentSessionId,
				questionId,
				data.programmingLanguageId,
				attemptNumber,
				data.sourceCode,
			];
			const result = await client.query<SubmissionRow>(query, values);
			const submission = this.mapRow(result.rows[0]);
			await client.query('COMMIT');
			debug(
				'[%s] Submission created: %s Attempt: %d',
				rqUID,
				submission.id,
				submission.attemptNumber
			);
			return submission;
		} catch (error) {
			await client.query('ROLLBACK');
			debug(
				'[%s] Error creating submission. Session: %s Question: %s',
				rqUID,
				assessmentSessionId,
				questionId
			);
			throw error;
		} finally {
			client.release();
		}
	}

	public async findById(rqUID: string, id: string): Promise<Submission | null> {
		debug('[%s] Finding submission: %s', rqUID, id);
		const query = `
			SELECT
				id,
				assessment_session_id,
				question_id,
				programming_language_id,
				attempt_number,
				source_code,
				status,
				score,
				error_message,
				submitted_at
			FROM submission
			WHERE id = $1;
		`;
		const result = await pool.query<SubmissionRow>(query, [id]);

		if (result.rows.length === 0) {
			debug('[%s] Submission not found: %s', rqUID, id);
			return null;
		}
		return this.mapRow(result.rows[0]);
	}

	public async findBySessionAndQuestion(
		rqUID: string,
		assessmentSessionId: string,
		questionId: string
	): Promise<Submission[]> {
		debug(
			'[%s] Finding submissions. Session: %s Question: %s',
			rqUID,
			assessmentSessionId,
			questionId
		);
		const query = `
			SELECT
				id,
				assessment_session_id,
				question_id,
				programming_language_id,
				attempt_number,
				source_code,
				status,
				score,
				error_message,
				submitted_at
			FROM submission
			WHERE assessment_session_id = $1
				AND question_id = $2
			ORDER BY attempt_number ASC;
		`;

		const result = await pool.query<SubmissionRow>(query, [assessmentSessionId, questionId]);
		const submissions = result.rows.map((row) => this.mapRow(row));
		debug(
			'[%s] Submissions found. Session: %s Question: %s Count: %d',
			rqUID,
			assessmentSessionId,
			questionId,
			submissions.length
		);
		return submissions;
	}

	private mapRow(row: SubmissionRow): Submission {
		return {
			id: row.id,
			assessmentSessionId: row.assessment_session_id,
			questionId: row.question_id,
			programmingLanguageId: row.programming_language_id,
			attemptNumber: row.attempt_number,
			sourceCode: row.source_code,
			status: row.status,
			score: row.score === null ? null : Number(row.score),
			errorMessage: row.error_message,
			submittedAt: row.submitted_at,
		};
	}

	public async markAsEvaluated(
		rqUID: string,
		id: string,
		score: number,
		errorMessage: string | null = null
	): Promise<Submission | null> {
		debug('[%s] Marking submission as EVALUATED: %s Score: %d', rqUID, id, score);
		const query = `
		UPDATE submission
		SET
			status = 'EVALUATED',
			score = $2,
			error_message = $3
		WHERE id = $1
			AND status = 'PENDING'
		RETURNING
			id,
			assessment_session_id,
			question_id,
			programming_language_id,
			attempt_number,
			source_code,
			status,
			score,
			error_message,
			submitted_at;
	`;
		const result = await pool.query<SubmissionRow>(query, [id, score, errorMessage]);

		if (result.rows.length === 0) {
			debug('[%s] Pending submission not found for evaluation: %s', rqUID, id);
			return null;
		}

		const submission = this.mapRow(result.rows[0]);
		debug('[%s] Submission evaluated: %s Score: %d', rqUID, submission.id, submission.score);
		return submission;
	}

	public async markAsFailed(
		rqUID: string,
		id: string,
		errorMessage: string
	): Promise<Submission | null> {
		debug('[%s] Marking submission as FAILED: %s', rqUID, id);
		const query = `
		UPDATE submission
		SET
			status = 'FAILED',
			score = NULL,
			error_message = $2
		WHERE id = $1
			AND status = 'PENDING'
		RETURNING
			id,
			assessment_session_id,
			question_id,
			programming_language_id,
			attempt_number,
			source_code,
			status,
			score,
			error_message,
			submitted_at;
	`;
		const result = await pool.query<SubmissionRow>(query, [id, errorMessage]);

		if (result.rows.length === 0) {
			debug('[%s] Pending submission not found for failure: %s', rqUID, id);

			return null;
		}

		const submission = this.mapRow(result.rows[0]);
		debug('[%s] Submission marked as FAILED: %s', rqUID, submission.id);
		return submission;
	}
}

export default new SubmissionRepository();
