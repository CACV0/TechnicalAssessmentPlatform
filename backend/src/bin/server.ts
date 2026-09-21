import { Server } from 'http';
import debugLib from 'debug';

import app from '../app';
import config from '../config';
import { connectDatabase } from '../database/postgres';

const debug = debugLib('platform:server');

let server: Server;

const startServer = async (): Promise<void> => {
	try {
		await connectDatabase();

		server = app.listen(config.CONFIG.PORT, () => {
			debug(`Server running on port ${config.CONFIG.PORT}`);
		});

		server.on('error', (error: NodeJS.ErrnoException) => {
			debug('Server error: %s', error.message);

			if (error.code === 'EADDRINUSE') {
				debug(`Port ${config.CONFIG.PORT} is already in use.`);
			}

			process.exit(1);
		});
	} catch (error) {
		debug('Unexpected error while starting server: %O', error);
		process.exit(1);
	}
};

const shutdown = (signal: string): void => {
	debug('%s received. Shutting down...', signal);

	if (!server) {
		process.exit(0);
	}

	server.close((error) => {
		if (error) {
			debug('Error while closing server: %O', error);
			process.exit(1);
		}

		debug('Server closed successfully.');
		process.exit(0);
	});
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();
