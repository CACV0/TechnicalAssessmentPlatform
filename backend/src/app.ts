import cors from 'cors';
import cookieParser from 'cookie-parser';
import express, { Request, Response } from 'express';
import path from 'path';

const app = express();

app.use(cors({}));
app.use(express.json());

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../static')));


app.get('/health', (_req: Request, res: Response) => {
	res.status(200).json({ status: 'OK' });
});

export default app;
