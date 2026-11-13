import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';
import { API_BASE, CLIENT_ID } from './config';

export type Session = { token: string; refreshToken?: string; expiresAt: number; user: { uid: string; email: string; name: string } };
const KEY = 'shopyethu.auth.v1';
let current: Session | null = null;
let refreshing: Promise<string | null> | null = null;
const listeners = new Set<(session: Session | null) => void>();
export const subscribe = (listener: (session: Session | null) => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function currentSession() { return current; }
export async function saveSession(session: Session | null) {
  if (session) await SecureStore.setItemAsync(KEY, JSON.stringify(session));
  else await SecureStore.deleteItemAsync(KEY);
  current = session;
  listeners.forEach(listener => listener(session));
}
export async function hydrateSession() {
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return null;
  try {
    const saved = JSON.parse(raw) as Session;
    if (!saved.user?.uid || !saved.token || !Number.isFinite(saved.expiresAt)) throw new Error();
    current = saved; return saved;
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
    } catch { if (current === previous) await saveSession(null); return null; }
    finally { refreshing = null; }
  })();
  return refreshing;
}
