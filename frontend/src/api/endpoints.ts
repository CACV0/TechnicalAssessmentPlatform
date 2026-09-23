import { request } from './client';
import type {
  Assessment,
  AssessmentSession,
  CodeInput,
  CreateAssessmentInput,
  CreateQuestionInput,
  CreateTestCaseInput,
  ProgrammingLanguage,
  Question,
  RunCodeResult,
  SessionSummary,
  Submission,
  SubmissionResult,
  TestCase,
} from './types';

const questionPath = (assessmentId: string, questionId: string) =>
  `/assessments/${assessmentId}/questions/${questionId}`;

export const api = {
  // Assessments
  listAssessments: () => request<Assessment[]>('GET', '/assessments'),
  getAssessment: (id: string) => request<Assessment>('GET', `/assessments/${id}`),
  createAssessment: (data: CreateAssessmentInput) =>
    request<Assessment>('POST', '/assessments', data),
  publishAssessment: (id: string) => request<Assessment>('POST', `/assessments/${id}/publish`),
  closeAssessment: (id: string) => request<Assessment>('POST', `/assessments/${id}/close`),

  // Preguntas
  listQuestions: (assessmentId: string) =>
    request<Question[]>('GET', `/assessments/${assessmentId}/questions`),
  getQuestion: (assessmentId: string, questionId: string) =>
    request<Question>('GET', questionPath(assessmentId, questionId)),
  createQuestion: (assessmentId: string, data: CreateQuestionInput) =>
    request<Question>('POST', `/assessments/${assessmentId}/questions`, data),
  deleteQuestion: (assessmentId: string, questionId: string) =>
    request<unknown>('DELETE', questionPath(assessmentId, questionId)),

  // Lenguajes
  listActiveLanguages: () => request<ProgrammingLanguage[]>('GET', '/programming-languages'),
  getQuestionLanguages: (assessmentId: string, questionId: string) =>
    request<ProgrammingLanguage[]>('GET', `${questionPath(assessmentId, questionId)}/languages`),
  setQuestionLanguages: (assessmentId: string, questionId: string, languageIds: string[]) =>
    request<ProgrammingLanguage[]>('PUT', `${questionPath(assessmentId, questionId)}/languages`, {
      languageIds,
    }),

  // Casos de prueba
  listTestCases: (assessmentId: string, questionId: string) =>
    request<TestCase[]>('GET', `${questionPath(assessmentId, questionId)}/test-cases`),
  createTestCase: (assessmentId: string, questionId: string, data: CreateTestCaseInput) =>
    request<TestCase>('POST', `${questionPath(assessmentId, questionId)}/test-cases`, data),

  // Sesiones (el candidato presentando un assessment)
  startSession: (assessmentId: string, candidateName: string, candidateEmail: string) =>
    request<AssessmentSession>('POST', `/assessments/${assessmentId}/sessions`, {
      candidateName,
      candidateEmail,
    }),
  getSessionSummary: (sessionId: string) =>
    request<SessionSummary>('GET', `/assessment-sessions/${sessionId}/summary`),
  completeSession: (sessionId: string) =>
    request<AssessmentSession>('POST', `/assessment-sessions/${sessionId}/complete`),

  // Ejecución y envío
  runCode: (sessionId: string, questionId: string, data: CodeInput) =>
    request<RunCodeResult>(
      'POST',
      `/assessment-sessions/${sessionId}/questions/${questionId}/run`,
      data,
    ),
  submitCode: (sessionId: string, questionId: string, data: CodeInput) =>
    request<Submission>(
      'POST',
      `/assessment-sessions/${sessionId}/questions/${questionId}/submissions`,
      data,
    ),
  getSubmissionResult: (submissionId: string) =>
    request<SubmissionResult>('GET', `/submissions/${submissionId}/results`),
};
