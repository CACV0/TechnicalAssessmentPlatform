import { Router } from 'express';
import AssessmentController from '../module/assessment/controller/assessmentController';
import QuestionController from '../module/question/controller/questionController';
import ProgrammingLanguageController from '../module/programmingLanguage/controller/programmingLanguageController';
import TestCaseController from '../module/testCase/controller/testCaseController';
import AssessmentSessionController from '../module/assessmentSession/controller/assessmentSessionController';
import SubmissionController from '../module/submission/controller/submissionController';
import EvaluationController from '../module/evaluation/controller/evaluationController';

class RouterPlatafform {
	public router: Router = Router();

	constructor() {
		this.routerConfig();
	}

	private routerConfig(): void {
		// Assessment
		this.router.post('/assessments', AssessmentController.create);
		this.router.get('/assessments', AssessmentController.findAll);
		this.router.get('/assessments/:id', AssessmentController.findById);
		this.router.put('/assessments/:id', AssessmentController.update);
		this.router.post('/assessments/:id/publish', AssessmentController.publish);
		this.router.post('/assessments/:id/close', AssessmentController.close);

		// Question
		this.router.post('/assessments/:assessmentId/questions', QuestionController.create);
		this.router.get(
			'/assessments/:assessmentId/questions',
			QuestionController.findAllByAssessmentId
		);
		this.router.get(
			'/assessments/:assessmentId/questions/:questionId',
			QuestionController.findById
		);
		this.router.put('/assessments/:assessmentId/questions/:questionId', QuestionController.update);
		this.router.delete(
			'/assessments/:assessmentId/questions/:questionId',
			QuestionController.delete
		);

		// Programming Language
		this.router.get('/programming-languages', ProgrammingLanguageController.findAllActive);
		this.router.get(
			'/assessments/:assessmentId/questions/:questionId/languages',
			ProgrammingLanguageController.findByQuestionId
		);
		this.router.put(
			'/assessments/:assessmentId/questions/:questionId/languages',
			ProgrammingLanguageController.updateQuestionLanguages
		);

		// Test Case
		this.router.post(
			'/assessments/:assessmentId/questions/:questionId/test-cases',
			TestCaseController.create
		);
		this.router.get(
			'/assessments/:assessmentId/questions/:questionId/test-cases',
			TestCaseController.findAllByQuestionId
		);
		this.router.get(
			'/assessments/:assessmentId/questions/:questionId/test-cases/:testCaseId',
			TestCaseController.findById
		);
		this.router.put(
			'/assessments/:assessmentId/questions/:questionId/test-cases/:testCaseId',
			TestCaseController.update
		);
		this.router.delete(
			'/assessments/:assessmentId/questions/:questionId/test-cases/:testCaseId',
			TestCaseController.delete
		);

		// Assessment Session
		this.router.post('/assessments/:assessmentId/sessions', AssessmentSessionController.create);
		this.router.get('/assessment-sessions/:sessionId', AssessmentSessionController.findById);
		this.router.post(
			'/assessment-sessions/:sessionId/complete',
			AssessmentSessionController.complete
		);

		// Submission
		this.router.post(
			'/assessment-sessions/:sessionId/questions/:questionId/submissions',
			SubmissionController.create
		);
		this.router.get(
			'/assessment-sessions/:sessionId/questions/:questionId/submissions',
			SubmissionController.findBySessionAndQuestion
		);
		this.router.get('/submissions/:submissionId/results', SubmissionController.findResult);
		this.router.get('/submissions/:submissionId', SubmissionController.findById);

		// Evaluation
		this.router.post(
			'/assessment-sessions/:sessionId/questions/:questionId/run',
			EvaluationController.run
		);
	}
}

const routerPlatafform = new RouterPlatafform();
export default routerPlatafform.router;
