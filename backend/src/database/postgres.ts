import { Pool } from 'pg';
import debugLib from 'debug';
import config from '../config';

const debug = debugLib('platform:database');

const pool = new Pool({
    host: config.DB_CONFIG.DB_HOST,
    port: config.DB_CONFIG.DB_PORT,
    database: config.DB_CONFIG.DB_NAME,
    user: config.DB_CONFIG.DB_USER,
    password: config.DB_CONFIG.DB_PASSWORD,
});

export const connectDatabase = async (): Promise<void> => {
    try {
        const result = await pool.query('SELECT NOW()');

        debug('PostgreSQL connection successful');
        debug('Database time: %s', result.rows[0].now);
    } catch (error) {
        debug('PostgreSQL connection failed: %O', error);
        throw error;
    }
};

export default pool;