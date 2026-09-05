import { ApiError } from '@/api/client';

const API_BASE = '/api';

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

/** Downloads a file response (xlsx export, backup) and saves it via the browser. */
export async function downloadFile(path: string, fallbackFilename: string): Promise<void> {
  const response = await fetch(`${API_BASE}${path}`, { credentials: 'same-origin' });
  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response, `Request failed: ${response.status}`));
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition');
  const filename = disposition?.match(/filename="?([^"]+)"?/)?.[1] ?? fallbackFilename;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Uploads a file as multipart/form-data (no Content-Type header - the browser sets the boundary). */
export async function uploadFile<T>(path: string, file: File): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'same-origin',
    body: formData,
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response, `Request failed: ${response.status}`));
  }

  return response.json() as Promise<T>;
}
