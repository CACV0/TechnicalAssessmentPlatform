import cors from 'cors';
import cookieParser from 'cookie-parser';
import express, { Request, Response } from 'express';
import path from 'path';
import routerPlatafform from './route/route';
import errorHandler, { notFoundHandler } from './middleware/errorHandler';
import { OpenApiValidatorProvider } from './util/validatorApi';

const app = express();

app.use(express.json());
app.use(
	express.urlencoded({
		extended: false,
	})
);
app.use(express.static(path.join(__dirname, '../static')));
app.use(cors({}));
app.use(cookieParser());

app.get('/health', (_req: Request, res: Response) => {
	res.status(200).json({
		status: 'OK - Plattaform is running',
	});
});

app.use(OpenApiValidatorProvider);
app.use(routerPlatafform);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
