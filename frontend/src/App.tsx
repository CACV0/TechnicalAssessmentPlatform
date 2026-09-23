import { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AdminAssessmentDetailPage } from './pages/admin/AdminAssessmentDetailPage';
import { AdminAssessmentsPage } from './pages/admin/AdminAssessmentsPage';
import { AssessmentListPage } from './pages/AssessmentListPage';
import { ResultsPage } from './pages/ResultsPage';
import { SessionPage } from './pages/SessionPage';
import { Loader } from './components/ui';

// El editor (Monaco) es pesado: se descarga solo cuando el candidato abre una pregunta.
const EditorPage = lazy(() =>
  import('./pages/EditorPage').then((module) => ({ default: module.EditorPage })),
);

/**
 * Rutas de la aplicación:
 *  /                                         Pantalla 1 - Listado de assessments
 *  /sessions/:sessionId                      Pantalla 2 - Detalle del assessment
 *  /sessions/:sessionId/questions/:questionId Pantalla 3 - Editor de código
 *  /sessions/:sessionId/results              Pantalla 4 - Resultados
 *  /admin, /admin/assessments/:assessmentId  Gestión de assessments y preguntas
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<AssessmentListPage />} />
          <Route path="/sessions/:sessionId" element={<SessionPage />} />
          <Route
            path="/sessions/:sessionId/questions/:questionId"
            element={
              <Suspense fallback={<Loader text="Cargando editor..." />}>
                <EditorPage />
              </Suspense>
            }
          />
          <Route path="/sessions/:sessionId/results" element={<ResultsPage />} />
          <Route path="/admin" element={<AdminAssessmentsPage />} />
          <Route path="/admin/assessments/:assessmentId" element={<AdminAssessmentDetailPage />} />
          <Route
            path="*"
            element={
              <div className="page empty">
                Página no encontrada. <Link to="/">Ir al inicio</Link>
              </div>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
