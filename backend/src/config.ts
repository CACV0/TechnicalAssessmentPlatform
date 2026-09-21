import * as process from 'process';

export default {
	CONFIG: {
		PORT: Number(process.env.PORT) || 3074,
		PATH_PLATAFFORM: process.env.PATH_PLATAFFORM || '/platafform/v1',
	},
	DB_CONFIG: {
		DB_HOST: process.env.DB_HOST || 'localhost',
		DB_PORT: Number(process.env.DB_PORT) || 5432,
		DB_NAME: process.env.DB_NAME || 'technical_assessment_platform_db',
		DB_USER: process.env.DB_USER || 'postgres',
		DB_PASSWORD: process.env.DB_PASSWORD || 'Admin123+',
	},
};
