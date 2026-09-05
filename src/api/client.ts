export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// VITE_API_URL points at a separately-hosted backend (e.g. Render) when the
// frontend is deployed on its own (e.g. Vercel). Unset for a same-origin/
// combined deployment, where a relative '/api' is correct, same as dev.
const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    // 'include' also sends cookies on same-origin requests, so this is
    // correct for both the combined and split-hosting deployments.
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path: string) => request<void>(path, { method: 'DELETE' }),
};
