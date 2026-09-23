import { useState, type FormEvent } from 'react';
import { api } from '../../api/endpoints';
import type { ProgrammingLanguage, TestCaseVisibility } from '../../api/types';
import { ErrorBox } from '../../components/ui';

interface TestCaseDraft {
  input: string;
  expectedOutput: string;
  visibility: TestCaseVisibility;
}

interface QuestionFormProps {
  assessmentId: string;
  displayOrder: number;
  languages: ProgrammingLanguage[];
  onCreated: () => void | Promise<void>;
}

const emptyTestCase = (visibility: TestCaseVisibility): TestCaseDraft => ({
  input: '',
  expectedOutput: '',
  visibility,
});

/**
 * Crea una pregunta completa. Por debajo son varias llamadas al backend:
 * 1) crear la pregunta, 2) asignar lenguajes permitidos, 3) crear cada caso de prueba.
 */
export function QuestionForm({ assessmentId, displayOrder, languages, onCreated }: QuestionFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [score, setScore] = useState(10);
  const [languageIds, setLanguageIds] = useState<string[]>(languages.map((l) => l.id));
  const [testCases, setTestCases] = useState<TestCaseDraft[]>([
    emptyTestCase('PUBLIC'),
    emptyTestCase('HIDDEN'),
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleLanguage = (id: string) =>
    setLanguageIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  const updateTestCase = (index: number, patch: Partial<TestCaseDraft>) =>
    setTestCases((current) =>
      current.map((testCase, i) => (i === index ? { ...testCase, ...patch } : testCase)),
    );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (languageIds.length === 0) {
      setError('Selecciona al menos un lenguaje.');
      return;
    }
    if (testCases.length === 0) {
      setError('Agrega al menos un caso de prueba.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const question = await api.createQuestion(assessmentId, {
        title: title.trim(),
        description: description.trim(),
        score,
        displayOrder,
      });
      await api.setQuestionLanguages(assessmentId, question.id, languageIds);
      for (const [index, testCase] of testCases.entries()) {
        await api.createTestCase(assessmentId, question.id, {
          input: testCase.input === '' ? null : testCase.input,
          expectedOutput: testCase.expectedOutput,
          visibility: testCase.visibility,
          displayOrder: index + 1,
        });
      }
      await onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la pregunta');
      setSaving(false);
    }
  };

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h3>Nueva pregunta #{displayOrder}</h3>
      <label className="field">
        <span>Título</span>
        <input
          required
          maxLength={200}
          placeholder="Valor máximo de un arreglo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className="field">
        <span>Descripción</span>
        <textarea
          required
          rows={4}
          placeholder="Dado un arreglo de números, retorne el valor máximo. La entrada es una línea con los números separados por comas."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <label className="field field-short">
        <span>Puntaje</span>
        <input
          required
          type="number"
          min={0.01}
          step={0.01}
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
        />
      </label>

      <fieldset className="field">
        <span>Lenguajes permitidos</span>
        <div className="checkbox-row">
          {languages.map((language) => (
            <label key={language.id} className="checkbox">
              <input
                type="checkbox"
                checked={languageIds.includes(language.id)}
                onChange={() => toggleLanguage(language.id)}
              />
              {language.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <span>Casos de prueba</span>
        <p className="muted small">
          Los <strong>públicos</strong> se muestran como ejemplo y se usan al pulsar “Ejecutar”. Los{' '}
          <strong>ocultos</strong> solo se usan al calificar.
        </p>
        {testCases.map((testCase, index) => (
          <div key={index} className="testcase-row">
            <label className="field">
              <span>Entrada (stdin)</span>
              <textarea
                rows={2}
                placeholder="3,5,1,8"
                value={testCase.input}
                onChange={(e) => updateTestCase(index, { input: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Salida esperada</span>
              <textarea
                required
                rows={2}
                placeholder="8"
                value={testCase.expectedOutput}
                onChange={(e) => updateTestCase(index, { expectedOutput: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Visibilidad</span>
              <select
                value={testCase.visibility}
                onChange={(e) =>
                  updateTestCase(index, { visibility: e.target.value as TestCaseVisibility })
                }
              >
                <option value="PUBLIC">Público</option>
                <option value="HIDDEN">Oculto</option>
              </select>
            </label>
            <button
              type="button"
              className="btn btn-ghost btn-sm testcase-remove"
              onClick={() => setTestCases((current) => current.filter((_, i) => i !== index))}
              aria-label="Quitar caso de prueba"
            >
              ✕
            </button>
          </div>
        ))}
        <div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setTestCases((current) => [...current, emptyTestCase('HIDDEN')])}
          >
            + Agregar caso de prueba
          </button>
        </div>
      </div>

      {error && <ErrorBox message={error} />}
      <div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar pregunta'}
        </button>
      </div>
    </form>
  );
}
