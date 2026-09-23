import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/endpoints';
import { CodeEditor } from '../components/CodeEditor';
import { ResultConsole, type ConsoleState } from '../components/ResultConsole';
import { ErrorBox, Loader, StatusBadge } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { useCountdown } from '../hooks/useCountdown';
import { formatClock, formatScore } from '../utils/format';
import { getMonacoLanguage, loadDraft, saveDraft } from '../utils/languages';

/** Pantalla 3 - Editor de código: seleccionar lenguaje, escribir, ejecutar y enviar. */
export function EditorPage() {
  const { sessionId = '', questionId = '' } = useParams();

  // Se carga todo lo necesario para la pregunta: sesión, enunciado, lenguajes y casos públicos.
  const { data, loading, error, reload } = useAsync(async () => {
    const summary = await api.getSessionSummary(sessionId);
    const assessmentId = summary.session.assessmentId;
    const [question, languages, testCases] = await Promise.all([
      api.getQuestion(assessmentId, questionId),
      api.getQuestionLanguages(assessmentId, questionId),
      api.listTestCases(assessmentId, questionId),
    ]);
    return {
      summary,
      question,
      languages: languages.filter((language) => language.isActive),
      publicTestCases: testCases.filter((testCase) => testCase.visibility === 'PUBLIC'),
    };
  }, [sessionId, questionId]);

  const [languageId, setLanguageId] = useState('');
  const [sourceCode, setSourceCode] = useState('');
  const [consoleState, setConsoleState] = useState<ConsoleState>({ kind: 'idle' });

  const inProgress = data?.summary.session.status === 'IN_PROGRESS';
  const remaining = useCountdown(data?.summary.remainingSeconds ?? null, inProgress);
  const timeIsUp = !inProgress || remaining === 0;
  const busy = consoleState.kind === 'loading';

  const language = data?.languages.find((item) => item.id === languageId);

  // Al cargar la pregunta se selecciona el primer lenguaje permitido.
  useEffect(() => {
    if (data && !data.languages.some((item) => item.id === languageId)) {
      setLanguageId(data.languages[0]?.id ?? '');
    }
  }, [data, languageId]);

  // Al cambiar de lenguaje se recupera el borrador guardado (o la plantilla inicial).
  useEffect(() => {
    if (language) {
      setSourceCode(loadDraft(sessionId, questionId, language.code));
      setConsoleState({ kind: 'idle' });
    }
  }, [language, sessionId, questionId]);

  if (loading && !data) return <Loader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;

  const { summary, question, languages, publicTestCases } = data;
  const questionIndex = summary.questions.findIndex((item) => item.questionId === questionId);
  const previous = summary.questions[questionIndex - 1];
  const next = summary.questions[questionIndex + 1];

  const handleCodeChange = (value: string) => {
    setSourceCode(value);
    if (language) saveDraft(sessionId, questionId, language.code, value);
  };

  const handleRun = async () => {
    setConsoleState({ kind: 'loading', message: 'Compilando y ejecutando casos públicos...' });
    try {
      const result = await api.runCode(sessionId, questionId, {
        programmingLanguageId: languageId,
        sourceCode,
      });
      setConsoleState({ kind: 'run', result });
    } catch (err) {
      setConsoleState({ kind: 'error', message: errorMessage(err) });
    }
  };

  const handleSubmit = async () => {
    if (!window.confirm('¿Enviar esta solución para calificarla con todos los casos de prueba?')) {
      return;
    }
    setConsoleState({ kind: 'loading', message: 'Calificando con todos los casos de prueba...' });
    try {
      const submission = await api.submitCode(sessionId, questionId, {
        programmingLanguageId: languageId,
        sourceCode,
      });
      const result = await api.getSubmissionResult(submission.id);
      setConsoleState({ kind: 'submit', submission, result, maxScore: question.score });
    } catch (err) {
      setConsoleState({ kind: 'error', message: errorMessage(err) });
    }
  };

  return (
    <div className="editor-page">
      <aside className="problem-panel">
        <Link to={`/sessions/${sessionId}`} className="back-link">
          ← Volver a {summary.assessmentName}
        </Link>
        <div className="problem-header">
          <span className="eyebrow">
            Pregunta {question.displayOrder} de {summary.totalQuestions}
          </span>
          <span className="badge badge-info">{formatScore(question.score)} puntos</span>
        </div>
        <h1 className="problem-title">{question.title}</h1>
        <p className="problem-description">{question.description}</p>

        <div className="hint">
          Tu programa debe leer la entrada por <strong>entrada estándar (stdin)</strong> e imprimir
          la respuesta por <strong>salida estándar (stdout)</strong>.
        </div>

        {publicTestCases.length > 0 && (
          <>
            <h2 className="section-title">Ejemplos</h2>
            {publicTestCases.map((testCase, index) => (
              <div key={testCase.id} className="example">
                <span className="io-label">Ejemplo {index + 1} · Entrada</span>
                <pre className="console-pre">{testCase.input || '(vacío)'}</pre>
                <span className="io-label">Salida esperada</span>
                <pre className="console-pre">{testCase.expectedOutput}</pre>
              </div>
            ))}
          </>
        )}

        <div className="question-nav">
          {previous ? (
            <Link className="btn btn-ghost btn-sm" to={`/sessions/${sessionId}/questions/${previous.questionId}`}>
              ← Anterior
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link className="btn btn-ghost btn-sm" to={`/sessions/${sessionId}/questions/${next.questionId}`}>
              Siguiente →
            </Link>
          )}
        </div>
      </aside>

      <section className="workspace">
        <div className="toolbar">
          <label className="toolbar-field">
            <span>Lenguaje</span>
            <select
              value={languageId}
              onChange={(event) => setLanguageId(event.target.value)}
              disabled={busy}
            >
              {languages.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} {item.version ? `(${item.version})` : ''}
                </option>
              ))}
            </select>
          </label>

          <div className="toolbar-right">
            {inProgress ? (
              <span className={`timer ${remaining !== null && remaining < 300 ? 'timer-low' : ''}`}>
                {formatClock(remaining ?? 0)}
              </span>
            ) : (
              <StatusBadge status={summary.session.status} />
            )}
            <button
              className="btn btn-secondary"
              onClick={handleRun}
              disabled={busy || timeIsUp || !languageId}
            >
              ▶ Ejecutar
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={busy || timeIsUp || !languageId}
            >
              Enviar respuesta
            </button>
          </div>
        </div>

        {languages.length === 0 ? (
          <ErrorBox message="Esta pregunta no tiene lenguajes permitidos configurados." />
        ) : (
          <div className="editor-wrap">
            <CodeEditor
              language={getMonacoLanguage(language?.code ?? '')}
              value={sourceCode}
              onChange={handleCodeChange}
              readOnly={timeIsUp}
            />
          </div>
        )}

        <div className="console">
          <div className="console-title">Consola de resultados</div>
          <div className="console-body">
            <ResultConsole state={consoleState} publicTestCases={publicTestCases} />
          </div>
        </div>
      </section>
    </div>
  );
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Error inesperado';
}
