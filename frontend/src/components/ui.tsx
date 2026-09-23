import type { ReactNode } from 'react';

/** Componentes visuales pequeños que se reutilizan en todas las pantallas. */

export function Loader({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className="loader">
      <span className="spinner" />
      {text}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-box">
      <span>{message}</span>
      {onRetry && (
        <button className="btn btn-ghost btn-sm" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}

type BadgeTone = 'neutral' | 'success' | 'danger' | 'warning' | 'info';

const STATUS_TONES: Record<string, { tone: BadgeTone; label: string }> = {
  DRAFT: { tone: 'neutral', label: 'Borrador' },
  PUBLISHED: { tone: 'success', label: 'Publicado' },
  CLOSED: { tone: 'danger', label: 'Cerrado' },
  IN_PROGRESS: { tone: 'info', label: 'En curso' },
  COMPLETED: { tone: 'success', label: 'Finalizado' },
  EXPIRED: { tone: 'warning', label: 'Tiempo agotado' },
  CORRECT: { tone: 'success', label: 'Correcta' },
  INCORRECT: { tone: 'danger', label: 'Incorrecta' },
  NOT_ANSWERED: { tone: 'neutral', label: 'Sin responder' },
  PASSED: { tone: 'success', label: 'Exitoso' },
  FAILED: { tone: 'danger', label: 'Fallido' },
  ERROR: { tone: 'danger', label: 'Error' },
  TIMEOUT: { tone: 'warning', label: 'Tiempo excedido' },
  PUBLIC: { tone: 'info', label: 'Público' },
  HIDDEN: { tone: 'neutral', label: 'Oculto' },
};

export function StatusBadge({ status }: { status: string }) {
  const { tone, label } = STATUS_TONES[status] ?? { tone: 'neutral', label: status };
  return <span className={`badge badge-${tone}`}>{label}</span>;
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}

export function ProgressBar({ percentage }: { percentage: number }) {
  const value = Math.max(0, Math.min(100, percentage));
  return (
    <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-fill" style={{ width: `${value}%` }} />
    </div>
  );
}
