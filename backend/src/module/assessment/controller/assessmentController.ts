import { NextFunction, Request, Response } from 'express';
import debugLib from 'debug';

import assessmentService from '../service/assessmentService';
import apiResponse from '../../../generic/response';

const debug = debugLib('platform:AssessmentController');

class AssessmentController {
	public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';
		try {
			debug('[%s] Creating assessment', rqUID);
			const assessment = await assessmentService.create(rqUID, req.body);
			debug('[%s] Assessment created: %s', rqUID, assessment.id);
			res
				.status(201)
				.json(
					apiResponse.success(
						rqUID,
						201,
						'ASSESSMENT_CREATED',
						'Assessment created successfully',
						assessment
					)
				);
		} catch (error) {
			debug('[%s] Error creating assessment: %O', rqUID, error);
			next(error);
		}
	}

	public async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';
		try {
			debug('[%s] Getting assessments', rqUID);
			const assessments = await assessmentService.findAll(rqUID);
			debug('[%s] Assessments retrieved: %d', rqUID, assessments.length);
			res
				.status(200)
				.json(
					apiResponse.success(
						rqUID,
						200,
						'ASSESSMENTS_FOUND',
						'Assessments retrieved successfully',
						assessments
					)
				);
		} catch (error) {
			debug('[%s] Error getting assessments: %O', rqUID, error);
			next(error);
		}
	}

	public async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';
		const { id } = req.params;
		try {
			debug('[%s] Getting assessment: %s', rqUID, id);
			const assessment = await assessmentService.findById(rqUID, id);
			debug('[%s] Assessment retrieved: %s', rqUID, id);
			res
				.status(200)
				.json(
					apiResponse.success(
						rqUID,
						200,
						'ASSESSMENT_FOUND',
						'Assessment retrieved successfully',
						assessment
					)
				);
		} catch (error) {
			debug('[%s] Error getting assessment %s: %O', rqUID, id, error);
			next(error);
		}
	}

	public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';
		const { id } = req.params;
		try {
			debug('[%s] Updating assessment: %s', rqUID, id);
			const assessment = await assessmentService.update(rqUID, id, req.body);
			debug('[%s] Assessment updated: %s', rqUID, id);
			res
				.status(200)
				.json(
					apiResponse.success(
						rqUID,
						200,
						'ASSESSMENT_UPDATED',
						'Assessment updated successfully',
						assessment
					)
				);
		} catch (error) {
			debug('[%s] Error updating assessment %s: %O', rqUID, id, error);
			next(error);
		}
	}

	public async publish(req: Request, res: Response, next: NextFunction): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';
		const { id } = req.params;
		try {
			debug('[%s] Publishing assessment: %s', rqUID, id);
			const assessment = await assessmentService.publish(rqUID, id);
			debug('[%s] Assessment published: %s', rqUID, id);
			res
				.status(200)
				.json(
					apiResponse.success(
						rqUID,
						200,
						'ASSESSMENT_PUBLISHED',
						'Assessment published successfully',
						assessment
					)
				);
		} catch (error) {
			debug('[%s] Error publishing assessment %s: %O', rqUID, id, error);
			next(error);
		}
	}

	public async close(req: Request, res: Response, next: NextFunction): Promise<void> {
		const rqUID = req.header('X-RqUID') || '';
		const { id } = req.params;
		try {
			debug('[%s] Closing assessment: %s', rqUID, id);
			const assessment = await assessmentService.close(rqUID, id);
			debug('[%s] Assessment closed: %s', rqUID, id);
			res
				.status(200)
				.json(
					apiResponse.success(
						rqUID,
						200,
						'ASSESSMENT_CLOSED',
						'Assessment closed successfully',
						assessment
					)
				);
		} catch (error) {
			debug('[%s] Error closing assessment %s: %O', rqUID, id, error);
			next(error);
		}
	}
}

export default new AssessmentController();
