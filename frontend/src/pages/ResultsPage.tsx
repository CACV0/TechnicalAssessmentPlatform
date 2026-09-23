import { Link, useParams } from 'react-router-dom';
import { api } from '../api/endpoints';
import { ErrorBox, Loader, ProgressBar, StatCard, StatusBadge } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { formatDuration, formatScore } from '../utils/format';

/** Pantalla 4 - Resultados: puntaje, preguntas correctas/incorrectas y tiempo consumido. */
export function ResultsPage() {
  const { sessionId = '' } = useParams();
  const { data: summary, loading, error, reload } = useAsync(
    () => api.getSessionSummary(sessionId),
    [sessionId],
  );

  if (loading) return <Loader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!summary) return null;

  const notAnswered = summary.totalQuestions - summary.answeredQuestions;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Resultados</h1>
          <p className="muted">
            {summary.assessmentName} · {summary.session.candidateName}
          </p>
        </div>
        <StatusBadge status={summary.session.status} />
      </div>

      {summary.session.status === 'IN_PROGRESS' && (
        <div className="banner banner-info">
          La evaluación sigue en curso; estos resultados son parciales.{' '}
          <Link to={`/sessions/${sessionId}`}>Volver a la evaluación</Link>
        </div>
      )}

      <div className="result-hero card">
        <span className="result-percentage">{formatScore(summary.percentage)}%</span>
        <span className="muted">
          {formatScore(summary.score)} de {formatScore(summary.maxScore)} puntos
        </span>
        <ProgressBar percentage={summary.percentage} />
      </div>

      <div className="stats">
        <StatCard label="Puntaje obtenido" value={formatScore(summary.score)} hint={`de ${formatScore(summary.maxScore)}`} />
        <StatCard label="Preguntas correctas" value={<span className="text-success">{summary.correctQuestions}</span>} />
        <StatCard
          label="Preguntas incorrectas"
          value={<span className="text-danger">{summary.incorrectQuestions}</span>}
          hint={notAnswered > 0 ? `${notAnswered} sin responder` : undefined}
        />
        <StatCard
          label="Tiempo consumido"
          value={formatDuration(summary.elapsedSeconds)}
          hint={`de ${summary.timeLimitMinutes} min`}
        />
      </div>

      <section className="section">
        <h2 className="section-title">Detalle por pregunta</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Pregunta</th>
                <th>Intentos</th>
                <th>Puntaje</th>
                <th>Resultado</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Link to="/" className="btn btn-ghost">
        ← Volver al listado
      </Link>
    </div>
  );
}
