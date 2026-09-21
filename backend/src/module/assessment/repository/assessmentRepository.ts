import debugLib from 'debug';

import pool from '../../../database/postgres';
import {
	Assessment,
	AssessmentStatus,
	CreateAssessmentInput,
	UpdateAssessmentInput,
} from '../types/assessmentTypes';

const debug = debugLib('platform:AssessmentRepository');

interface AssessmentRow {
	id: string;
	name: string;
	description: string | null;
	time_limit_minutes: number;
	status: AssessmentStatus;
	created_at: Date;
	updated_at: Date;
}

class AssessmentRepository {
	public async create(rqUID: string, data: CreateAssessmentInput): Promise<Assessment> {
		debug('[%s] Inserting assessment', rqUID);
		const query = `
			INSERT INTO assessment (
				name,
				description,
				time_limit_minutes
			)
			VALUES ($1, $2, $3)
			RETURNING
				id,
				name,
				description,
				time_limit_minutes,
				status,
				created_at,
				updated_at;
		`;
		const values = [data.name, data.description ?? null, data.timeLimitMinutes];
		const result = await pool.query<AssessmentRow>(query, values);
		const assessment = this.mapRow(result.rows[0]);
		debug('[%s] Assessment inserted: %s', rqUID, assessment.id);
		return assessment;
	}

	public async findAll(rqUID: string): Promise<Assessment[]> {
		debug('[%s] Finding all assessments', rqUID);
		const query = `
			SELECT
				id,
				name,
				description,
				time_limit_minutes,
				status,
				created_at,
				updated_at
			FROM assessment
			ORDER BY created_at DESC;
		`;
		const result = await pool.query<AssessmentRow>(query);
		const assessments = result.rows.map((row) => this.mapRow(row));
		debug('[%s] Assessments found: %d', rqUID, assessments.length);
		return assessments;
	}

	public async findById(rqUID: string, id: string): Promise<Assessment | null> {
		debug('[%s] Finding assessment: %s', rqUID, id);
		const query = `
			SELECT
				id,
				name,
				description,
				time_limit_minutes,
				status,
				created_at,
				updated_at
			FROM assessment
			WHERE id = $1;
		`;
		const result = await pool.query<AssessmentRow>(query, [id]);
		if (result.rows.length === 0) {
			debug('[%s] Assessment not found: %s', rqUID, id);
			return null;
		}
		return this.mapRow(result.rows[0]);
	}

	public async update(rqUID: string, id: string, data: UpdateAssessmentInput): Promise<Assessment> {
		debug('[%s] Updating assessment: %s', rqUID, id);
		const query = `
			UPDATE assessment
			SET
				name = COALESCE($2, name),
				description = COALESCE($3, description),
				time_limit_minutes = COALESCE(
					$4,
					time_limit_minutes
				),
				updated_at = NOW()
			WHERE id = $1
			RETURNING
				id,
				name,
				description,
				time_limit_minutes,
				status,
				created_at,
				updated_at;
		`;
		const values = [id, data.name ?? null, data.description ?? null, data.timeLimitMinutes ?? null];
		const result = await pool.query<AssessmentRow>(query, values);
		const assessment = this.mapRow(result.rows[0]);
		debug('[%s] Assessment updated: %s', rqUID, id);
		return assessment;
	}

	public async updateStatus(
		rqUID: string,
		id: string,
		status: AssessmentStatus
	): Promise<Assessment> {
		debug('[%s] Updating assessment status. ID: %s Status: %s', rqUID, id, status);
		const query = `
			UPDATE assessment
			SET
				status = $2,
				updated_at = NOW()
			WHERE id = $1
			RETURNING
				id,
				name,
				description,
				time_limit_minutes,
				status,
				created_at,
				updated_at;
		`;
		const result = await pool.query<AssessmentRow>(query, [id, status]);
		const assessment = this.mapRow(result.rows[0]);
		debug('[%s] Assessment status updated. ID: %s Status: %s', rqUID, id, status);
		return assessment;
	}

	private mapRow(row: AssessmentRow): Assessment {
		return {
			id: row.id,
			name: row.name,
			description: row.description,
			timeLimitMinutes: row.time_limit_minutes,
			status: row.status,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		};
	}
}

export default new AssessmentRepository();
