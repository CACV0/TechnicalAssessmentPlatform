import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/endpoints';
import { ErrorBox, Loader, StatusBadge } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync';
import { formatScore, pluralize } from '../../utils/format';
import { QuestionForm } from './QuestionForm';

/** Administración - detalle de un assessment: preguntas, publicar y cerrar. */
export function AdminAssessmentDetailPage() {
  const { assessmentId = '' } = useParams();

  const { data, loading, error, reload } = useAsync(async () => {
    const [assessment, questions, activeLanguages] = await Promise.all([
      api.getAssessment(assessmentId),
      api.listQuestions(assessmentId),
      api.listActiveLanguages(),
    ]);
    // Para cada pregunta se consultan sus lenguajes y casos de prueba.
    const details = await Promise.all(
      questions.map(async (question) => {
        const [languages, testCases] = await Promise.all([
          api.getQuestionLanguages(assessmentId, question.id),
          api.listTestCases(assessmentId, question.id),
        ]);
        return { question, languages, testCases };
      }),
    );
    return { assessment, details, activeLanguages };
  }, [assessmentId]);

  const [showForm, setShowForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (loading && !data) return <Loader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;

  const { assessment, details, activeLanguages } = data;
  const editable = assessment.status === 'DRAFT';
  const nextDisplayOrder = Math.max(0, ...details.map((d) => d.question.displayOrder)) + 1;
  const incomplete = details.filter(
    (d) => d.languages.length === 0 || d.testCases.length === 0,
  );

  const runAction = async (action: () => Promise<unknown>, confirmMessage: string) => {
    if (!window.confirm(confirmMessage)) return;
    setActionError(null);
    try {
      await action();
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'La acción falló');
    }
  };

  return (
    <div className="page">
      <Link to="/admin" className="back-link">
        ← Volver a administración
      </Link>
      <div className="page-header">
        <div>
          <h1>
            {assessment.name} <StatusBadge status={assessment.status} />
          </h1>
          <p className="muted">
            {assessment.description || 'Sin descripción'} · {assessment.timeLimitMinutes} min ·{' '}
            {pluralize(assessment.questionCount, 'pregunta')}
          </p>
        </div>
        <div className="header-actions">
          {editable && (
            <button
              className="btn btn-primary"
              disabled={details.length === 0 || incomplete.length > 0}
              title={
                incomplete.length > 0
                  ? 'Todas las preguntas necesitan al menos un lenguaje y un caso de prueba'
                  : undefined
              }
              onClick={() =>
                runAction(
                  () => api.publishAssessment(assessment.id),
                  'Una vez publicado ya no podrás editar sus preguntas. ¿Publicar?',
                )
              }
            >
              Publicar
            </button>
          )}
          {assessment.status === 'PUBLISHED' && (
            <button
              className="btn btn-danger"
              onClick={() =>
                runAction(
                  () => api.closeAssessment(assessment.id),
                  'Los candidatos ya no podrán iniciarlo. ¿Cerrar el assessment?',
                )
              }
            >
              Cerrar
            </button>
          )}
        </div>
      </div>

      {actionError && <ErrorBox message={actionError} />}
      {!editable && (
        <div className="banner banner-info">
          Solo los assessments en borrador se pueden editar.
        </div>
      )}

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Preguntas</h2>
          {editable && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Cancelar' : '+ Agregar pregunta'}
            </button>
          )}
        </div>

        {showForm && (
          <QuestionForm
            assessmentId={assessment.id}
            displayOrder={nextDisplayOrder}
            languages={activeLanguages}
            onCreated={async () => {
              setShowForm(false);
              await reload();
            }}
          />
        )}

        {details.length === 0 && !showForm && <div className="empty">Aún no hay preguntas.</div>}

        {details.map(({ question, languages, testCases }) => (
          <article key={question.id} className="card question-card">
            <div className="question-card-header">
              <h3>
                {question.displayOrder}. {question.title}
              </h3>
              <div className="header-actions">
                <span className="badge badge-info">{formatScore(question.score)} pts</span>
                {editable && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() =>
                      runAction(
                        () => api.deleteQuestion(assessment.id, question.id),
                        `¿Eliminar la pregunta "${question.title}"?`,
                      )
                    }
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
            <p className="problem-description">{question.description}</p>
            <div className="question-card-meta">
              <span>
                <strong>Lenguajes:</strong>{' '}
                {languages.length > 0 ? (
                  languages.map((language) => language.name).join(', ')
                ) : (
                  <span className="text-danger">ninguno</span>
                )}
              </span>
              <span>
                <strong>Casos de prueba:</strong>{' '}
                {testCases.length === 0 ? (
                  <span className="text-danger">ninguno</span>
                ) : (
                  `${testCases.filter((t) => t.visibility === 'PUBLIC').length} públicos · ${
                    testCases.filter((t) => t.visibility === 'HIDDEN').length
                  } ocultos`
                )}
              </span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
