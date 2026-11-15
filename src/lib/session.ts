import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';
import { API_BASE, CLIENT_ID } from './config';
import type { AccountUser } from './account-user';
import { networkState } from './network-state';

export type Session = { token: string; refreshToken?: string; expiresAt: number; user: AccountUser };
const KEY = 'shopyethu.auth.v1';
let current: Session | null = null;
let revision = 0;
export function sessionRevision() { return revision; }
let refreshing: Promise<string | null> | null = null;
const listeners = new Set<(session: Session | null) => void>();
export const subscribe = (listener: (session: Session | null) => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function currentSession() { return current; }
export async function saveSession(session: Session | null) {
  if (session) await SecureStore.setItemAsync(KEY, JSON.stringify(session));
  else await SecureStore.deleteItemAsync(KEY);
  if (current?.user.uid !== session?.user.uid) revision++;
  current = session;
  listeners.forEach(listener => listener(session));
}
export async function hydrateSession() {
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return null;
  try {
    const saved = JSON.parse(raw) as Session;
    if (!saved.user?.uid || !saved.token || !Number.isFinite(saved.expiresAt)) throw new Error();
    if (current?.user.uid !== saved.user.uid) revision++;
    current = saved; listeners.forEach(listener => listener(saved)); return saved;
  } catch { await saveSession(null); return null; }
}
export async function accessToken(): Promise<string | null> {
  if (!current) return null;
  if (current.expiresAt > Date.now() + 30_000) return current.token;
  if (!current.refreshToken) { await saveSession(null); return null; }
  if (refreshing) return refreshing;
  const previous = current;
  refreshing = (async () => {
    try {
      const token = await AuthSession.refreshAsync({ clientId: CLIENT_ID, refreshToken: previous.refreshToken! }, { tokenEndpoint: `${API_BASE}/oauth/token` });
      if (current !== previous) return current?.token || null;
      await saveSession({ ...previous, token: token.accessToken, refreshToken: token.refreshToken || previous.refreshToken, expiresAt: Date.now() + (token.expiresIn || 3600) * 1000 });
      return token.accessToken;
    } catch (cause) {
      const code = (cause as { code?: string }).code;
      if (current !== previous) return current?.token || null;
      if (['invalid_grant', 'invalid_client', 'unauthorized_client'].includes(code || '')) {
        await saveSession(null); return null;
      }
      // Losing connectivity must not erase an otherwise valid saved account/cache.
      networkState.record(false);
      throw Object.assign(new Error('Could not refresh your session. Check your connection and retry.'), { status: 0 });
    }
    finally { refreshing = null; }
  })();
  return refreshing;
}
