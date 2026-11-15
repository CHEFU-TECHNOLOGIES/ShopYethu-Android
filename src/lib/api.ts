import { API_BASE } from './config';
import { accessToken, currentSession, saveSession, sessionRevision } from './session';
import { publicQuery } from './query-policy';
import { networkState } from './network-state';
import { publishApiMutation, publishApiRejection } from './api-events';
import { toast } from './toast';

export class ApiError extends Error { constructor(message: string, readonly status: number) { super(message); } }
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
    const identity = currentSession()?.user.uid;
    const revision = sessionRevision();
    const isPublic = publicQuery(path);
    const token = isPublic ? null : await accessToken();
    if (!isPublic && (currentSession()?.user.uid !== identity || sessionRevision() !== revision)) throw new ApiError('Your account changed. Please retry.', 401);
    const headers = new Headers(options.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (options.body) headers.set('Content-Type', 'application/json');
    const response = await fetch(`${API_BASE}/shopyethu${path}`, {
        ...options, headers,
        signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000),
    }).catch(error => { if (options.signal?.aborted) throw error; networkState.record(false); throw new ApiError('Could not reach ShopYethu. Check your connection and try again.', 0); });
    networkState.record(true);
    const data = await response.json().catch(() => null);
    if (!isPublic && (currentSession()?.user.uid !== identity || sessionRevision() !== revision)) throw new ApiError('Your account changed. Please retry.', 401);
    if (response.status === 401 && token && currentSession()?.token === token) {
        await saveSession(null); toast.warning('Your session ended. Please sign in again.');
    }
    if (!response.ok) {
        if (!isPublic && response.status === 403) publishApiRejection(path);
        const message = typeof data?.message === 'string' ? data.message : data?.error;
        if (response.status === 404 && (typeof message !== 'string' || message.startsWith('Cannot '))) throw new ApiError('This marketplace feature is not available on the server yet. Please try again later.', 404);
        if (response.status >= 500) throw new ApiError('ShopYethu could not complete this request. Please try again shortly.', response.status);
        if (response.status === 429) throw new ApiError('Too many attempts. Please wait a moment and try again.', 429);
        throw new ApiError(typeof message === 'string' ? message : 'Something went wrong. Please try again.', response.status);
    }
    if (options.method && options.method !== 'GET') publishApiMutation({ path, data });
    return data as T;
}
