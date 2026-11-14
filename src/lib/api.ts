import { API_BASE } from './config';
import { accessToken, currentSession, saveSession } from './session';

export class ApiError extends Error { constructor(message: string, readonly status: number) { super(message); } }
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const identity = currentSession()?.user.uid;
  const token = await accessToken();
  if (currentSession()?.user.uid !== identity) throw new ApiError('Your account changed. Please retry.', 401);
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API_BASE}/shopyethu${path}`, {
    ...options, headers,
    signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000),
  }).catch(error => { if (options.signal?.aborted) throw error; throw new ApiError('Could not reach ShopYethu. Check your connection and try again.', 0); });
  const data = await response.json().catch(() => null);
  if (currentSession()?.user.uid !== identity) throw new ApiError('Your account changed. Please retry.', 401);
  if (response.status === 401 && currentSession()?.token === token) await saveSession(null);
  if (!response.ok) {
    const message = typeof data?.message === 'string' ? data.message : data?.error;
    if (response.status === 404 && (typeof message !== 'string' || message.startsWith('Cannot '))) throw new ApiError('This marketplace feature is not available on the server yet. Please try again later.', 404);
    throw new ApiError(typeof message === 'string' ? message : 'Something went wrong. Please try again.', response.status);
  }
  return data as T;
}
