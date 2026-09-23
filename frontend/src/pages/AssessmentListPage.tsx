import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/endpoints';
import type { Assessment } from '../api/types';
import { ErrorBox, Loader } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { pluralize } from '../utils/format';
import { addRecentSession, getRecentSessions } from '../utils/recentSessions';

/** Pantalla 1 - Listado de assessments disponibles para el candidato. */
export function AssessmentListPage() {
  const { data, loading, error, reload } = useAsync(() => api.listAssessments(), []);
  const [selected, setSelected] = useState<Assessment | null>(null);
  const recentSessions = getRecentSessions();

  const published = (data ?? []).filter((assessment) => assessment.status === 'PUBLISHED');

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Evaluaciones disponibles</h1>
          <p className="muted">Selecciona una prueba técnica para comenzar.</p>
        </div>
      </div>

      {loading && <Loader />}
      {error && <ErrorBox message={error} onRetry={reload} />}

      {!loading && !error && published.length === 0 && (
        <div className="empty">
          No hay evaluaciones publicadas. Crea y publica una desde{' '}
          <Link to="/admin">Administración</Link>.
        </div>
      )}

      <div className="card-grid">
        {published.map((assessment) => (
          <article key={assessment.id} className="card assessment-card">
            <h2>{assessment.name}</h2>
            <p className="muted clamp">{assessment.description || 'Sin descripción'}</p>
            <div className="assessment-meta">
              <span>{assessment.timeLimitMinutes} min</span>
              <span>{pluralize(assessment.questionCount, 'pregunta')}</span>
            </div>
            <button
              className="btn btn-primary"
              disabled={assessment.questionCount === 0}
              onClick={() => setSelected(assessment)}
            >
              Iniciar evaluación
            </button>
          </article>
        ))}
      </div>

      {recentSessions.length > 0 && (
        <section className="section">
          <h2 className="section-title">Retomar una sesión</h2>
          <ul className="recent-list">
            {recentSessions.map((session) => (
              <li key={session.sessionId}>
                <Link to={`/sessions/${session.sessionId}`}>
                  {session.assessmentName} — {session.candidateName}
                </Link>
                <span className="muted">
                  {new Date(session.startedAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {selected && <StartSessionDialog assessment={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function StartSessionDialog({
  assessment,
  onClose,
}: {
  assessment: Assessment;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const session = await api.startSession(assessment.id, name.trim(), email.trim());
      addRecentSession({
        sessionId: session.id,
        assessmentName: assessment.name,
        candidateName: session.candidateName,
        startedAt: session.startedAt,
      });
      navigate(`/sessions/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar la sesión');
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{assessment.name}</h2>
        <p className="muted">
          Tendrás <strong>{assessment.timeLimitMinutes} minutos</strong> para resolver{' '}
          {pluralize(assessment.questionCount, 'pregunta')}. El tiempo empieza al confirmar.
        </p>
        <label className="field">
          <span>Nombre completo</span>
          <input required maxLength={150} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          <span>Correo electrónico</span>
          <input
            required
            type="email"
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        {error && <ErrorBox message={error} />}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Iniciando...' : 'Comenzar'}
          </button>
        </div>
      </form>
    </div>
  );
}
