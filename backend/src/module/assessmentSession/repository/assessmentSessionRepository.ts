import debugLib from 'debug';
import pool from '../../../database/postgres';
import {
	AssessmentSession,
	AssessmentSessionStatus,
	CreateAssessmentSessionInput,
	QuestionProgressRow,
} from '../types/assessmentSessionTypes';

const debug = debugLib('platform:AssessmentSessionRepository');

interface AssessmentSessionRow {
	id: string;
	assessment_id: string;
	candidate_name: string;
	candidate_email: string;
	status: AssessmentSessionStatus;
	started_at: Date;
	expires_at: Date;
	completed_at: Date | null;
	created_at: Date;
}

interface QuestionProgressDbRow {
	question_id: string;
	title: string;
	display_order: number;
	max_score: string;
	attempts: number;
	best_score: string | null;
	last_submission_id: string | null;
}

class AssessmentSessionRepository {
	public async create(
		rqUID: string,
		assessmentId: string,
		data: CreateAssessmentSessionInput,
		expiresAt: Date
	): Promise<AssessmentSession> {
		debug(
			'[%s] Inserting assessment session. Assessment: %s Candidate: %s',
			rqUID,
			assessmentId,
			data.candidateEmail
		);
		const query = `
			INSERT INTO assessment_session (
				assessment_id,
				candidate_name,
				candidate_email,
				expires_at
			)
			VALUES ($1, $2, $3, $4)
			RETURNING
				id,
				assessment_id,
				candidate_name,
				candidate_email,
				status,
				started_at,
				expires_at,
				completed_at,
				created_at;
		`;
		const values = [assessmentId, data.candidateName, data.candidateEmail, expiresAt];
		const result = await pool.query<AssessmentSessionRow>(query, values);
		const session = this.mapRow(result.rows[0]);
		debug('[%s] Assessment session inserted: %s', rqUID, session.id);
		return session;
	}

	public async findById(rqUID: string, id: string): Promise<AssessmentSession | null> {
		debug('[%s] Finding assessment session: %s', rqUID, id);
		const query = `
			SELECT
				id,
				assessment_id,
				candidate_name,
				candidate_email,
				status,
				started_at,
				expires_at,
				completed_at,
				created_at
			FROM assessment_session
			WHERE id = $1;
		`;
		const result = await pool.query<AssessmentSessionRow>(query, [id]);
		if (result.rows.length === 0) {
			debug('[%s] Assessment session not found: %s', rqUID, id);
			return null;
		}
		return this.mapRow(result.rows[0]);
	}

	public async updateStatus(
		rqUID: string,
		id: string,
		status: AssessmentSessionStatus,
		completedAt: Date | null = null
	): Promise<AssessmentSession> {
		debug('[%s] Updating assessment session status. ID: %s Status: %s', rqUID, id, status);
		const query = `
			UPDATE assessment_session
			SET
				status = $2,
				completed_at = $3
			WHERE id = $1
			RETURNING
				id,
				assessment_id,
				candidate_name,
				candidate_email,
				status,
				started_at,
				expires_at,
				completed_at,
				created_at;
		`;
		const result = await pool.query<AssessmentSessionRow>(query, [id, status, completedAt]);
		const session = this.mapRow(result.rows[0]);
		debug('[%s] Assessment session status updated. ID: %s Status: %s', rqUID, id, status);
		return session;
	}

	/**
	 * Returns every question of the assessment with the progress of the session:
	 * number of attempts, best evaluated score and the latest submission.
	 */
	public async findQuestionProgress(
		rqUID: string,
		sessionId: string,
		assessmentId: string
	): Promise<QuestionProgressRow[]> {
		debug('[%s] Finding question progress. Session: %s', rqUID, sessionId);
		const query = `
			SELECT
				q.id AS question_id,
				q.title,
				q.display_order,
				q.score AS max_score,
				COUNT(s.id)::int AS attempts,
				MAX(s.score) AS best_score,
				(ARRAY_AGG(s.id ORDER BY s.attempt_number DESC) FILTER (WHERE s.id IS NOT NULL))[1]
					AS last_submission_id
			FROM question q
			LEFT JOIN submission s
				ON s.question_id = q.id
				AND s.assessment_session_id = $1
			WHERE q.assessment_id = $2
			GROUP BY q.id
			ORDER BY q.display_order ASC;
		`;
		const result = await pool.query<QuestionProgressDbRow>(query, [sessionId, assessmentId]);
		debug('[%s] Question progress found. Session: %s Count: %d', rqUID, sessionId, result.rowCount);
		return result.rows.map((row) => ({
			questionId: row.question_id,
			title: row.title,
			displayOrder: row.display_order,
			maxScore: Number(row.max_score),
			attempts: row.attempts,
			bestScore: row.best_score === null ? null : Number(row.best_score),
			lastSubmissionId: row.last_submission_id,
		}));
	}

	private mapRow(row: AssessmentSessionRow): AssessmentSession {
		return {
			id: row.id,
			assessmentId: row.assessment_id,
			candidateName: row.candidate_name,
			candidateEmail: row.candidate_email,
			status: row.status,
			startedAt: row.started_at,
			expiresAt: row.expires_at,
			completedAt: row.completed_at,
			createdAt: row.created_at,
		};
	}
}

export default new AssessmentSessionRepository();
