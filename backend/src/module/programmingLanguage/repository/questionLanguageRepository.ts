import debugLib from 'debug';

import pool from '../../../database/postgres';
import { ProgrammingLanguage } from '../types/programmingLanguageTypes';

const debug = debugLib('platform:QuestionLanguageRepository');

interface ProgrammingLanguageRow {
	id: string;
	name: string;
	code: string;
	version: string | null;
	is_active: boolean;
}

class QuestionLanguageRepository {
	public async findByQuestionId(rqUID: string, questionId: string): Promise<ProgrammingLanguage[]> {
		debug('[%s] Finding languages for question: %s', rqUID, questionId);
		const query = `
			SELECT
				pl.id,
				pl.name,
				pl.code,
				pl.version,
				pl.is_active
			FROM question_language ql
			INNER JOIN programming_language pl
				ON pl.id = ql.programming_language_id
			WHERE ql.question_id = $1
			ORDER BY pl.name ASC;
		`;

		const result = await pool.query<ProgrammingLanguageRow>(query, [questionId]);
		const programmingLanguages = result.rows.map((row) => this.mapRow(row));
		debug(
			'[%s] Languages found for question %s: %d',
			rqUID,
			questionId,
			programmingLanguages.length
		);
		return programmingLanguages;
	}

	public async replace(rqUID: string, questionId: string, languageIds: string[]): Promise<void> {
		debug(
			'[%s] Replacing languages for question: %s. Count: %d',
			rqUID,
			questionId,
			languageIds.length
		);
		const client = await pool.connect();

		try {
			await client.query('BEGIN');
			await client.query(
				`
					DELETE FROM question_language
					WHERE question_id = $1;
				`,
				[questionId]
			);
			await client.query(
				`
					INSERT INTO question_language (
						question_id,
						programming_language_id
					)
					SELECT
						$1,
						UNNEST($2::uuid[]);
				`,
				[questionId, languageIds]
			);
			await client.query('COMMIT');
			debug('[%s] Languages replaced for question: %s', rqUID, questionId);
		} catch (error) {
			await client.query('ROLLBACK');
			debug('[%s] Error replacing languages for question: %s', rqUID, questionId);
			throw error;
		} finally {
			client.release();
		}
	}

	private mapRow(row: ProgrammingLanguageRow): ProgrammingLanguage {
		return {
			id: row.id,
			name: row.name,
			code: row.code,
			version: row.version,
			isActive: row.is_active,
		};
	}
}

export default new QuestionLanguageRepository();
