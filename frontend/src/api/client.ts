const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3074';

/** Error devuelto por el backend (Status.ServerStatusCode / ServerStatusDesc). */
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

interface ApiEnvelope<T> {
  RqUID: string;
  Status: {
    StatusCode: number;
    ServerStatusCode: string;
    ServerStatusDesc: string;
  };
  Data?: T;
}

/**
 * Hace la petición al backend. Todas las respuestas vienen envueltas en
 * { RqUID, Status, EndDt, Data }; aquí se devuelve solo Data o se lanza ApiError.
 */
export async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        // Identificador único por petición; el backend lo usa para trazar los logs.
        'X-RqUID': crypto.randomUUID(),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', `No se pudo conectar con el backend (${API_URL}).`);
  }

  const envelope = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !envelope) {
    throw new ApiError(
      response.status,
      envelope?.Status.ServerStatusCode ?? 'UNKNOWN_ERROR',
      envelope?.Status.ServerStatusDesc ?? `Error HTTP ${response.status}`,
    );
  }

  return envelope.Data as T;
}
