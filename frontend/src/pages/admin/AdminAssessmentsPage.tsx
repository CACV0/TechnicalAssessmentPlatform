import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/endpoints';
import { ErrorBox, Loader, StatusBadge } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync';

/** Administración - listado y creación de assessments. */
export function AdminAssessmentsPage() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(() => api.listAssessments(), []);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState(60);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const assessment = await api.createAssessment({
        name: name.trim(),
        description: description.trim() || undefined,
        timeLimitMinutes: timeLimit,
      });
      navigate(`/admin/assessments/${assessment.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo crear');
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Administración de assessments</h1>
          <p className="muted">
            Crea una evaluación, agrégale preguntas con sus casos de prueba y publícala.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((value) => !value)}>
          {showForm ? 'Cancelar' : '+ Nuevo assessment'}
        </button>
      </div>

      {showForm && (
        <form className="card form" onSubmit={handleCreate}>
          <label className="field">
            <span>Nombre</span>
            <input
              required
              maxLength={150}
              placeholder="Assessment Full Stack Cloud"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Descripción</span>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label className="field field-short">
            <span>Tiempo límite (minutos)</span>
            <input
              required
              type="number"
              min={1}
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
            />
          </label>
          {formError && <ErrorBox message={formError} />}
          <div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creando...' : 'Crear assessment'}
            </button>
          </div>
        </form>
      )}

      {loading && <Loader />}
      {error && <ErrorBox message={error} onRetry={reload} />}

      {data && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Tiempo</th>
                <th>Preguntas</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((assessment) => (
                <tr key={assessment.id}>
                  <td>{assessment.name}</td>
                  <td>
                    <StatusBadge status={assessment.status} />
                  </td>
                  <td>{assessment.timeLimitMinutes} min</td>
                  <td>{assessment.questionCount}</td>
                  <td className="cell-action">
                    <Link className="btn btn-ghost btn-sm" to={`/admin/assessments/${assessment.id}`}>
                      Gestionar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
