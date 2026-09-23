import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/endpoints';
import { ErrorBox, Loader, ProgressBar, StatCard, StatusBadge } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { useCountdown } from '../hooks/useCountdown';
import { formatClock, formatScore } from '../utils/format';

/** Pantalla 2 - Detalle del assessment: tiempo restante, preguntas, estado y puntaje. */
export function SessionPage() {
  const { sessionId = '' } = useParams();
  const navigate = useNavigate();
  const { data: summary, loading, error, reload } = useAsync(
    () => api.getSessionSummary(sessionId),
    [sessionId],
  );
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  const inProgress = summary?.session.status === 'IN_PROGRESS';
  const remaining = useCountdown(summary?.remainingSeconds ?? null, inProgress);

  // Cuando el contador llega a cero se vuelve a consultar: el backend marca la sesión como EXPIRED.
  useEffect(() => {
    if (inProgress && remaining === 0) {
      void reload();
    }
  }, [inProgress, remaining, reload]);

  if (loading && !summary) return <Loader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!summary) return null;

  const handleFinish = async () => {
    const pending = summary.totalQuestions - summary.answeredQuestions;
    const message =
      pending > 0
        ? `Tienes ${pending} pregunta(s) sin responder. ¿Deseas finalizar la evaluación?`
        : '¿Deseas finalizar la evaluación?';
    if (!window.confirm(message)) return;

    setFinishing(true);
    setFinishError(null);
    try {
      await api.completeSession(sessionId);
      navigate(`/sessions/${sessionId}/results`);
    } catch (err) {
      setFinishError(err instanceof Error ? err.message : 'No se pudo finalizar');
      setFinishing(false);
    }
  };

  const lowTime = inProgress && remaining !== null && remaining < 300;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{summary.assessmentName}</h1>
          <p className="muted">
            Candidato: {summary.session.candidateName} · {summary.session.candidateEmail}
          </p>
        </div>
        <div className="header-actions">
          {inProgress ? (
            <button className="btn btn-danger" onClick={handleFinish} disabled={finishing}>
              {finishing ? 'Finalizando...' : 'Finalizar evaluación'}
            </button>
          ) : (
            <Link className="btn btn-primary" to={`/sessions/${sessionId}/results`}>
              Ver resultados
            </Link>
          )}
        </div>
      </div>

      {finishError && <ErrorBox message={finishError} />}
      {summary.session.status === 'EXPIRED' && (
        <div className="banner banner-warning">
          El tiempo de la evaluación se agotó. Ya no puedes enviar respuestas.
        </div>
      )}

      <div className="stats">
        <StatCard
          label="Tiempo restante"
          value={
            <span className={lowTime ? 'text-danger' : undefined}>
              {inProgress ? formatClock(remaining ?? 0) : '00:00'}
            </span>
          }
          hint={`Límite: ${summary.timeLimitMinutes} min`}
        />
        <StatCard label="Estado" value={<StatusBadge status={summary.session.status} />} />
        <StatCard
          label="Puntaje acumulado"
          value={`${formatScore(summary.score)} / ${formatScore(summary.maxScore)}`}
          hint={`${formatScore(summary.percentage)}%`}
        />
        <StatCard
          label="Preguntas respondidas"
          value={`${summary.answeredQuestions} / ${summary.totalQuestions}`}
          hint={`${summary.correctQuestions} correctas · ${summary.incorrectQuestions} incorrectas`}
        />
      </div>

      <ProgressBar percentage={summary.percentage} />

      <section className="section">
        <h2 className="section-title">Preguntas</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Pregunta</th>
                <th>Intentos</th>
                <th>Puntaje</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {summary.questions.map((question) => (
                <tr key={question.questionId}>
                  <td>{question.displayOrder}</td>
                  <td>{question.title}</td>
                  <td>{question.attempts}</td>
                  <td>
                    {formatScore(question.bestScore ?? 0)} / {formatScore(question.maxScore)}
                  </td>
                  <td>
                    <StatusBadge status={question.result} />
                  </td>
                  <td className="cell-action">
                    {inProgress && (
                      <Link
                        className="btn btn-primary btn-sm"
                        to={`/sessions/${sessionId}/questions/${question.questionId}`}
                      >
                        {question.attempts > 0 ? 'Reintentar' : 'Resolver'}
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small">
          Cada pregunta toma el mejor de tus intentos. Una pregunta es correcta cuando pasa todos
          sus casos de prueba.
        </p>
      </section>
    </div>
  );
}
