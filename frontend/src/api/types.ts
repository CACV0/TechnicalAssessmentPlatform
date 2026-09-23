// Tipos que reflejan los contratos del backend (backend/static/platafform_OAS.json).

export type AssessmentStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export interface Assessment {
  id: string;
  name: string;
  description: string | null;
  timeLimitMinutes: number;
  status: AssessmentStatus;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssessmentInput {
  name: string;
  description?: string;
  timeLimitMinutes: number;
}

export interface Question {
  id: string;
  assessmentId: string;
  title: string;
  description: string;
  score: number;
  displayOrder: number;
}

export interface CreateQuestionInput {
  title: string;
  description: string;
  score: number;
  displayOrder: number;
}

export interface ProgrammingLanguage {
  id: string;
  name: string;
  code: string;
  version: string | null;
  isActive: boolean;
}

export type TestCaseVisibility = 'PUBLIC' | 'HIDDEN';

export interface TestCase {
  id: string;
  questionId: string;
  input: string | null;
  expectedOutput: string;
  visibility: TestCaseVisibility;
  displayOrder: number;
}

export interface CreateTestCaseInput {
  input: string | null;
  expectedOutput: string;
  visibility: TestCaseVisibility;
  displayOrder: number;
}

export type SessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';

export interface AssessmentSession {
  id: string;
  assessmentId: string;
  candidateName: string;
  candidateEmail: string;
  status: SessionStatus;
  startedAt: string;
  expiresAt: string;
  completedAt: string | null;
}

export type QuestionResult = 'CORRECT' | 'INCORRECT' | 'NOT_ANSWERED';

export interface QuestionProgress {
  questionId: string;
  title: string;
  displayOrder: number;
  maxScore: number;
  attempts: number;
  bestScore: number | null;
  lastSubmissionId: string | null;
  result: QuestionResult;
}

export interface SessionSummary {
  session: AssessmentSession;
  assessmentName: string;
  timeLimitMinutes: number;
  remainingSeconds: number;
  elapsedSeconds: number;
  totalQuestions: number;
  answeredQuestions: number;
  correctQuestions: number;
  incorrectQuestions: number;
  score: number;
  maxScore: number;
  percentage: number;
  questions: QuestionProgress[];
}

export interface CodeInput {
  programmingLanguageId: string;
  sourceCode: string;
}

export type TestCaseStatus = 'PASSED' | 'FAILED' | 'ERROR' | 'TIMEOUT';

export interface RunTestCaseResult {
  testCaseId: string;
  status: TestCaseStatus;
  input: string | null;
  actualOutput: string | null;
  errorMessage: string | null;
  executionTimeMs: number | null;
}

export interface RunCodeResult {
  status: 'COMPLETED' | 'COMPILE_ERROR';
  compileError: string | null;
  results: RunTestCaseResult[];
}

export type SubmissionStatus = 'PENDING' | 'EVALUATED' | 'FAILED';

export interface Submission {
  id: string;
  attemptNumber: number;
  status: SubmissionStatus;
  score: number | null;
  errorMessage: string | null;
  submittedAt: string;
}

export interface SubmissionTestCaseResult {
  testCaseId: string | null;
  visibility: TestCaseVisibility;
  status: TestCaseStatus;
  actualOutput: string | null;
  errorMessage: string | null;
  executionTimeMs: number | null;
}

export interface SubmissionResult {
  submissionId: string;
  status: SubmissionStatus;
  score: number | null;
  errorMessage: string | null;
  results: SubmissionTestCaseResult[];
}
