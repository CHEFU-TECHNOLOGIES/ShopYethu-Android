import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export function useResource<T>(path: string, enabled = true) {
  const { session } = useAuth();
  const [attempt, setAttempt] = useState(0);
  const key = `${session?.user.uid || 'guest'}:${path}:${attempt}`;
  const [state, setState] = useState<{ key: string; data: T | null; error: string; loading: boolean }>({ key, data: null, error: '', loading: true });
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void api<T>(path, { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setState({ key, data, error: '', loading: false });
    }).catch(error => { if (!controller.signal.aborted) setState({ key, data: null, error: error.message || 'Unable to load this page.', loading: false }); });
    return () => controller.abort();
  }, [path, key, enabled, attempt]);
  return { data: state.key === key ? state.data : null, error: state.key === key ? state.error : '', loading: enabled && (state.key !== key || state.loading), refresh: useCallback(() => setAttempt(value => value + 1), []) };
}
