import debugLib from 'debug';
import { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express';

import AppError from '../generic/error';
import apiResponse from '../generic/response';

const debug = debugLib('platform:error-handler');

export const notFoundHandler: RequestHandler = (
	req: Request,
	_res: Response,
	next: NextFunction
): void => {
	const rqUID = req.header('X-RqUID') || '';
	debug('[%s] Route not found: %s %s', rqUID, req.method, req.originalUrl);
	next(new AppError(404, 'ROUTE_NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
};

const errorHandler: ErrorRequestHandler = (
	error,
	req: Request,
	res: Response,
	_next: NextFunction
): void => {
	const rqUID = req.header('X-RqUID') || '';
	debug('[%s] Error processing request: %O', rqUID, error);

	if (error instanceof AppError) {
		res
			.status(error.statusCode)
			.json(apiResponse.error(rqUID, error.statusCode, error.serverStatusCode, error.message));
		return;
	}

	if (typeof error.status === 'number' && error.status >= 400 && error.status < 500) {
		res
			.status(error.status)
			.json(
				apiResponse.error(
					rqUID,
					error.status,
					error.status || 500,
					error.message || 'Request validation failed'
				)
			);
		return;
	}
	res
		.status(500)
		.json(apiResponse.error(rqUID, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error'));
};

export default errorHandler;
