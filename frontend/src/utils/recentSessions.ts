/** Sesiones iniciadas desde este navegador, para poder retomarlas tras recargar. */
export interface RecentSession {
  sessionId: string;
  assessmentName: string;
  candidateName: string;
  startedAt: string;
}

const KEY = 'recent-sessions';

export function getRecentSessions(): RecentSession[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as RecentSession[];
  } catch {
    return [];
  }
}

export function addRecentSession(session: RecentSession): void {
  try {
    const sessions = [session, ...getRecentSessions()].slice(0, 5);
    localStorage.setItem(KEY, JSON.stringify(sessions));
  } catch {
    // Almacenamiento no disponible: se ignora.
  }
}
