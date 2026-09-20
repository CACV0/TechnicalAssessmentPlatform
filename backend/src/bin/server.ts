import { Server } from 'http';

import app from '../app';
import config from '../config';

let server: Server;

const startServer = (): void => {
	try {
		server = app.listen(config.CONFIG.PORT, () => {
			console.log(`Server running on port ${config.CONFIG.PORT}`);
		});

		server.on('error', (error: NodeJS.ErrnoException) => {
			console.error('Server error:', error.message);

			if (error.code === 'EADDRINUSE') {
				console.error(`Port ${config.CONFIG.PORT} is already in use.`);
			}

			process.exit(1);
		});
	} catch (error) {
		console.error('Unexpected error while starting server:', error);
		process.exit(1);
	}
};

const shutdown = (signal: string): void => {
	console.log(`${signal} received. Shutting down...`);

	if (!server) {
		process.exit(0);
	}

	server.close((error) => {
		if (error) {
			console.error('Error while closing server:', error);
			process.exit(1);
		}

		console.log('Server closed successfully.');
		process.exit(0);
	});
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();
