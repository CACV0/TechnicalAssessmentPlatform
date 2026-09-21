import debugLib from 'debug';

import pool from '../../../database/postgres';
import { CreateQuestionRequest, Question, UpdateQuestionRequest } from '../types/questionTypes';

const debug = debugLib('platform:QuestionRepository');

interface QuestionRow {
	id: string;
	assessment_id: string;
	title: string;
	description: string;
	score: string;
	display_order: number;
	created_at: Date;
	updated_at: Date;
}

class QuestionRepository {
	public async create(
		rqUID: string,
		assessmentId: string,
		data: CreateQuestionRequest
	): Promise<Question> {
		debug('[%s] Creating question for assessment: %s', rqUID, assessmentId);
		const query = `
			INSERT INTO question (
				assessment_id,
				title,
				description,
				score,
				display_order
			)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING
				id,
				assessment_id,
				title,
				description,
				score,
				display_order,
				created_at,
				updated_at;
		`;
		const values = [assessmentId, data.title, data.description, data.score, data.displayOrder];
		const result = await pool.query<QuestionRow>(query, values);
		const question = this.mapRow(result.rows[0]);
		debug('[%s] Question created: %s', rqUID, question.id);
		return question;
	}

	public async findAllByAssessmentId(rqUID: string, assessmentId: string): Promise<Question[]> {
		debug('[%s] Finding questions for assessment: %s', rqUID, assessmentId);
		const query = `
			SELECT
				id,
				assessment_id,
				title,
				description,
				score,
				display_order,
				created_at,
				updated_at
			FROM question
			WHERE assessment_id = $1
			ORDER BY display_order ASC;
		`;
		const result = await pool.query<QuestionRow>(query, [assessmentId]);
		const questions = result.rows.map((row) => this.mapRow(row));
		debug('[%s] Questions found: %d', rqUID, questions.length);
		return questions;
	}

	public async findById(
		rqUID: string,
		assessmentId: string,
		questionId: string
	): Promise<Question | null> {
		debug('[%s] Finding question: %s', rqUID, questionId);
		const query = `
			SELECT
				id,
				assessment_id,
				title,
				description,
				score,
				display_order,
				created_at,
				updated_at
			FROM question
			WHERE id = $1
			AND assessment_id = $2;
		`;
		const result = await pool.query<QuestionRow>(query, [questionId, assessmentId]);
		if (result.rows.length === 0) {
			debug('[%s] Question not found: %s', rqUID, questionId);
			return null;
		}
		return this.mapRow(result.rows[0]);
	}

	public async findByDisplayOrder(
		rqUID: string,
		assessmentId: string,
		displayOrder: number,
		excludeQuestionId?: string
	): Promise<Question | null> {
		debug(
			'[%s] Finding question by display order. Assessment: %s Order: %d',
			rqUID,
			assessmentId,
			displayOrder
		);
		const query = `
		SELECT
			id,
			assessment_id,
			title,
			description,
			score,
			display_order,
			created_at,
			updated_at
		FROM question
		WHERE assessment_id = $1
		AND display_order = $2
		AND ($3::uuid IS NULL OR id <> $3);`;
		const result = await pool.query<QuestionRow>(query, [
			assessmentId,
			displayOrder,
			excludeQuestionId ?? null,
		]);

		if (result.rows.length === 0) {
			debug('[%s] No question found with display order: %d', rqUID, displayOrder);
			return null;
		}
		return this.mapRow(result.rows[0]);
	}

	public async update(
		rqUID: string,
		assessmentId: string,
		questionId: string,
		data: UpdateQuestionRequest
	): Promise<Question> {
		debug('[%s] Updating question: %s', rqUID, questionId);
		const query = `
			UPDATE question
			SET
				title = $1,
				description = $2,
				score = $3,
				display_order = $4,
				updated_at = NOW()
			WHERE id = $5
			AND assessment_id = $6
			RETURNING
				id,
				assessment_id,
				title,
				description,
				score,
				display_order,
				created_at,
				updated_at;
		`;
		const values = [
			data.title,
			data.description,
			data.score,
			data.displayOrder,
			questionId,
			assessmentId,
		];
		const result = await pool.query<QuestionRow>(query, values);
		const question = this.mapRow(result.rows[0]);
		debug('[%s] Question updated: %s', rqUID, questionId);
		return question;
	}

	public async delete(rqUID: string, assessmentId: string, questionId: string): Promise<boolean> {
		debug('[%s] Deleting question: %s', rqUID, questionId);
		const query = `
			DELETE FROM question
			WHERE id = $1
			AND assessment_id = $2;
		`;
		const result = await pool.query(query, [questionId, assessmentId]);
		const deleted = (result.rowCount ?? 0) > 0;
		debug('[%s] Question deleted: %s', rqUID, questionId);
		return deleted;
	}

	private mapRow(row: QuestionRow): Question {
		return {
			id: row.id,
			assessmentId: row.assessment_id,
			title: row.title,
			description: row.description,
			score: Number(row.score),
			displayOrder: row.display_order,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		};
	}
}

export default new QuestionRepository();
