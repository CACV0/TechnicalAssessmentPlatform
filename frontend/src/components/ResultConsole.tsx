import type {
  RunCodeResult,
  Submission,
  SubmissionResult,
  TestCase,
  TestCaseStatus,
  TestCaseVisibility,
} from '../api/types';
import { formatScore } from '../utils/format';
import { StatusBadge } from './ui';

export type ConsoleState =
  | { kind: 'idle' }
  | { kind: 'loading'; message: string }
  | { kind: 'error'; message: string }
  | { kind: 'run'; result: RunCodeResult }
  | { kind: 'submit'; submission: Submission; result: SubmissionResult; maxScore: number };

interface CaseRow {
  status: TestCaseStatus;
  visibility: TestCaseVisibility;
  input: string | null;
  expectedOutput: string | null;
  actualOutput: string | null;
  errorMessage: string | null;
  executionTimeMs: number | null;
}

interface ResultConsoleProps {
  state: ConsoleState;
  publicTestCases: TestCase[];
}

/** Pantalla de "consola": errores de compilación y resultado de cada caso de prueba. */
export function ResultConsole({ state, publicTestCases }: ResultConsoleProps) {
  const expectedById = new Map(publicTestCases.map((testCase) => [testCase.id, testCase]));

  if (state.kind === 'idle') {
    return (
      <p className="console-empty">
        Pulsa <strong>Ejecutar</strong> para probar tu código con los casos públicos, o{' '}
        <strong>Enviar</strong> para calificarlo con todos los casos (incluidos los ocultos).
      </p>
    );
  }

  if (state.kind === 'loading') {
    return (
      <div className="console-loading">
        <span className="spinner" />
        {state.message}
      </div>
    );
  }

  if (state.kind === 'error') {
    return <div className="console-block console-error">{state.message}</div>;
  }

  if (state.kind === 'run') {
    if (state.result.status === 'COMPILE_ERROR') {
      return <CompileError message={state.result.compileError} />;
    }
    const rows: CaseRow[] = state.result.results.map((result) => ({
      ...result,
      visibility: 'PUBLIC',
      expectedOutput: expectedById.get(result.testCaseId)?.expectedOutput ?? null,
    }));
    return (
      <>
        <div className="console-block console-success">Compilación exitosa</div>
        <Summary rows={rows} />
        <CaseList rows={rows} />
      </>
    );
  }

  // Envío (calificación con todos los casos)
  const { submission, result, maxScore } = state;
  if (submission.status === 'FAILED') {
    return (
      <div className="console-block console-error">
        No se pudo evaluar el envío: {submission.errorMessage}
      </div>
    );
  }
  const scoreLine = (
    <div className="console-score">
      Intento #{submission.attemptNumber} · Puntaje{' '}
      <strong>
        {formatScore(submission.score ?? 0)} / {formatScore(maxScore)}
      </strong>
    </div>
  );

  if (result.results.length === 0) {
    return (
      <>
        {scoreLine}
        <CompileError message={submission.errorMessage} />
      </>
    );
  }

  const rows: CaseRow[] = result.results.map((item) => ({
    ...item,
    input:
      item.testCaseId === null ? null : (expectedById.get(item.testCaseId)?.input ?? null),
    expectedOutput:
      item.testCaseId === null ? null : (expectedById.get(item.testCaseId)?.expectedOutput ?? null),
  }));
  return (
    <>
      {scoreLine}
      <Summary rows={rows} />
      <CaseList rows={rows} />
    </>
  );
}

function CompileError({ message }: { message: string | null }) {
  return (
    <>
      <div className="console-block console-error">Error de compilación</div>
      <pre className="console-pre console-pre-error">{message || 'Error de compilación'}</pre>
    </>
  );
}

function Summary({ rows }: { rows: CaseRow[] }) {
  const passed = rows.filter((row) => row.status === 'PASSED').length;
  const failed = rows.length - passed;
  const percentage = rows.length === 0 ? 0 : Math.round((passed / rows.length) * 100);
  return (
    <div className="console-summary">
      <span>{rows.length} casos ejecutados</span>
      <span className="text-success">{passed} exitosos</span>
      <span className="text-danger">{failed} fallidos</span>
      <strong>Resultado: {percentage}%</strong>
    </div>
  );
}

function CaseList({ rows }: { rows: CaseRow[] }) {
  return (
    <ul className="case-list">
      {rows.map((row, index) => (
        <li key={index} className="case-item">
          <div className="case-header">
            <span>
              Caso {index + 1} <StatusBadge status={row.visibility} />
            </span>
            <span className="case-meta">
              {row.executionTimeMs !== null && <span>{row.executionTimeMs} ms</span>}
              <StatusBadge status={row.status} />
            </span>
          </div>
          {row.visibility === 'HIDDEN' ? (
            <p className="case-hidden">Caso oculto: la entrada y la salida no se muestran.</p>
          ) : (
            <div className="case-grid">
              <IoBlock label="Entrada" value={row.input} />
              <IoBlock label="Salida esperada" value={row.expectedOutput} />
              <IoBlock label="Salida obtenida" value={row.actualOutput} />
              {row.errorMessage && <IoBlock label="Error" value={row.errorMessage} error />}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function IoBlock({ label, value, error }: { label: string; value: string | null; error?: boolean }) {
  return (
    <div className={error ? 'io-block io-block-error' : 'io-block'}>
      <span className="io-label">{label}</span>
      <pre className="console-pre">{value === null || value === '' ? '(vacío)' : value}</pre>
    </div>
  );
}
