import debugLib from 'debug';

import pool from '../../../database/postgres';
import { ProgrammingLanguage } from '../types/programmingLanguageTypes';

const debug = debugLib('platform:ProgrammingLanguageRepository');

interface ProgrammingLanguageRow {
	id: string;
	name: string;
	code: string;
	version: string | null;
	is_active: boolean;
}

class ProgrammingLanguageRepository {
	public async findAllActive(rqUID: string): Promise<ProgrammingLanguage[]> {
		debug('[%s] Finding active programming languages', rqUID);
		const query = `
			SELECT
				id,
				name,
				code,
				version,
				is_active
			FROM programming_language
			WHERE is_active = TRUE
			ORDER BY name ASC;
		`;

		const result = await pool.query<ProgrammingLanguageRow>(query);
		const programmingLanguages = result.rows.map((row) => this.mapRow(row));
		debug('[%s] Active programming languages found: %d', rqUID, programmingLanguages.length);
		return programmingLanguages;
	}

	public async findByIds(rqUID: string, languageIds: string[]): Promise<ProgrammingLanguage[]> {
		debug('[%s] Finding programming languages by ids. Count: %d', rqUID, languageIds.length);
		const query = `
			SELECT
				id,
				name,
				code,
				version,
				is_active
			FROM programming_language
			WHERE id = ANY($1::uuid[]);
		`;

		const result = await pool.query<ProgrammingLanguageRow>(query, [languageIds]);
		const programmingLanguages = result.rows.map((row) => this.mapRow(row));
		debug('[%s] Programming languages found by ids: %d', rqUID, programmingLanguages.length);
		return programmingLanguages;
	}

	public async findById(rqUID: string, id: string): Promise<ProgrammingLanguage | null> {
		debug('[%s] Finding programming language: %s', rqUID, id);
		const query = `
		SELECT
			id,
			name,
			code,
			version,
			is_active
		FROM programming_language
		WHERE id = $1;
	`;
		const result = await pool.query<ProgrammingLanguageRow>(query, [id]);

		if (result.rows.length === 0) {
			debug('[%s] Programming language not found: %s', rqUID, id);
			return null;
		}

		return this.mapRow(result.rows[0]);
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

export default new ProgrammingLanguageRepository();
