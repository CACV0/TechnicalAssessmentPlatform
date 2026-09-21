import debugLib from 'debug';

import assessmentRepository from '../repository/assessmentRepository';
import { Assessment, CreateAssessmentInput, UpdateAssessmentInput } from '../types/assessmentTypes';

import AppError from '../../../generic/error';

const debug = debugLib('platform:AssessmentService');

class AssessmentService {
	public async create(rqUID: string, data: CreateAssessmentInput): Promise<Assessment> {
		debug('[%s] Creating assessment', rqUID);
		const assessment = await assessmentRepository.create(rqUID, data);
		debug('[%s] Assessment created successfully: %s', rqUID, assessment.id);
		return assessment;
	}

	public async findAll(rqUID: string): Promise<Assessment[]> {
		debug('[%s] Getting assessments', rqUID);
		const assessments = await assessmentRepository.findAll(rqUID);
		debug('[%s] Assessments retrieved: %d', rqUID, assessments.length);
		return assessments;
	}

	public async findById(rqUID: string, id: string): Promise<Assessment> {
		debug('[%s] Getting assessment: %s', rqUID, id);
		const assessment = await assessmentRepository.findById(rqUID, id);
		if (!assessment) {
			debug('[%s] Assessment not found: %s', rqUID, id);
			throw new AppError(404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
		}
		return assessment;
	}

	public async update(rqUID: string, id: string, data: UpdateAssessmentInput): Promise<Assessment> {
		debug('[%s] Updating assessment: %s', rqUID, id);
		const assessment = await this.findById(rqUID, id);
		if (assessment.status !== 'DRAFT') {
			debug('[%s] Assessment cannot be updated. ID: %s Status: %s', rqUID, id, assessment.status);
			throw new AppError(409, 'ASSESSMENT_NOT_EDITABLE', 'Only DRAFT assessments can be updated');
		}
		const updatedAssessment = await assessmentRepository.update(rqUID, id, data);
		debug('[%s] Assessment updated successfully: %s', rqUID, id);
		return updatedAssessment;
	}

	public async publish(rqUID: string, id: string): Promise<Assessment> {
		debug('[%s] Publishing assessment: %s', rqUID, id);
		const assessment = await this.findById(rqUID, id);
		if (assessment.status !== 'DRAFT') {
			debug('[%s] Assessment cannot be published. ID: %s Status: %s', rqUID, id, assessment.status);
			throw new AppError(
				409,
				'ASSESSMENT_NOT_PUBLISHABLE',
				'Only DRAFT assessments can be published'
			);
		}
		const publishedAssessment = await assessmentRepository.updateStatus(rqUID, id, 'PUBLISHED');
		debug('[%s] Assessment published successfully: %s', rqUID, id);
		return publishedAssessment;
	}

	public async close(rqUID: string, id: string): Promise<Assessment> {
		debug('[%s] Closing assessment: %s', rqUID, id);
		const assessment = await this.findById(rqUID, id);
		if (assessment.status !== 'PUBLISHED') {
			debug('[%s] Assessment cannot be closed. ID: %s Status: %s', rqUID, id, assessment.status);
			throw new AppError(
				409,
				'ASSESSMENT_NOT_CLOSABLE',
				'Only PUBLISHED assessments can be closed'
			);
		}
		const closedAssessment = await assessmentRepository.updateStatus(rqUID, id, 'CLOSED');
		debug('[%s] Assessment closed successfully: %s', rqUID, id);
		return closedAssessment;
	}
}

export default new AssessmentService();
