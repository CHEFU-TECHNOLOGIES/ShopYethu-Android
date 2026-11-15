import { canonicalPath, publicQuery, queryPolicy } from './query-policy';

export type QuerySnapshot<T = unknown> = { data: T | null; error: string; loading: boolean; updatedAt: number | null };
export type SavedQuery = { path: string; scope: string; data: unknown; updatedAt: number };
type Entry = {
  path: string; scope: string; state: QuerySnapshot; listeners: Set<() => void>;
  active: number; touched: number; retryAt: number; generation: number;
  observers: Set<{ maxStaleMs?: number }>;
  controller?: AbortController; pending?: Promise<void>;
};
const EMPTY: QuerySnapshot = Object.freeze({ data: null, error: '', loading: false, updatedAt: null });
const aborted = () => new Error('Request cancelled.');
function pause(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) { reject(aborted()); return; }
    const cancel = () => { clearTimeout(timer); reject(aborted()); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', cancel); resolve(); }, ms);
    signal.addEventListener('abort', cancel, { once: true });
  });
}

// One cache owns all server snapshots; hooks only subscribe to it.
export function createQueryCache(
  fetcher: (path: string, signal: AbortSignal, scope: string) => Promise<unknown>,
  options: { now?: () => number; wait?: typeof pause; maxEntries?: number; maxBytes?: number } = {},
) {
  const now = options.now || Date.now;
  const entries = new Map<string, Entry>();
  const changes = new Set<() => void>();
  const key = (path: string, scope: string) => JSON.stringify([scope, canonicalPath(path)]);
  function emit(entry: Entry, persist = false) {
    entry.listeners.forEach(listener => listener());
    if (persist) changes.forEach(listener => listener());
  }
  function ensure(path: string, scope: string) {
    const id = key(path, scope);
    let entry = entries.get(id);
    if (!entry) {
      entry = { path: canonicalPath(path), scope, state: EMPTY, listeners: new Set(), active: 0, observers: new Set(), touched: now(), retryAt: 0, generation: 0 };
      entries.set(id, entry);
    }
    entry.touched = now();
    return entry;
  }
  function drop(entry: Entry) {
    entry.generation++; entry.controller?.abort(); entry.pending = undefined;
    entry.state = EMPTY; entry.retryAt = 0; emit(entry, true);
    if (!entry.listeners.size) entries.delete(key(entry.path, entry.scope));
  }
  function collect() {
    const idle = [...entries.values()].filter(entry => !entry.active && !entry.pending && !entry.listeners.size).sort((a, b) => a.touched - b.touched);
    let bytes = [...entries.values()].reduce((sum, entry) => sum + JSON.stringify(entry.state.data).length * 2, 0);
    for (const entry of idle) {
      if (entries.size <= (options.maxEntries || 60) && bytes <= (options.maxBytes || 1_500_000)) break;
      bytes -= JSON.stringify(entry.state.data).length * 2;
      entries.delete(key(entry.path, entry.scope));
    }
  }
  async function load(path: string, scope: string, force = false, maxStaleMs?: number) {
    const entry = ensure(path, scope);
    if (entry.pending) return entry.pending;
    const policy = queryPolicy(entry.path);
    const freshFor = Math.min(policy.staleMs, policy.maxAgeMs, maxStaleMs ?? Infinity);
    if (!force && (now() < entry.retryAt || !entry.state.error && entry.state.updatedAt !== null && now() - entry.state.updatedAt < freshFor)) return;
    const controller = new AbortController(), generation = entry.generation;
    entry.controller = controller;
    entry.state = { ...entry.state, loading: true, error: '' }; emit(entry);
    const valid = () => entry.generation === generation && !controller.signal.aborted;
    entry.pending = Promise.resolve().then(async () => {
      try {
        let data: unknown;
        for (let attempt = 0; ; attempt++) {
          try { data = await fetcher(entry.path, controller.signal, entry.scope); break; }
          catch (error) {
            const status = (error as { status?: number }).status;
            if (!valid() || attempt >= 2 || !(status === 0 || status === 429 || status !== undefined && status >= 500)) throw error;
            await (options.wait || pause)(500 * 2 ** attempt + Math.floor(Math.random() * 200), controller.signal);
          }
        }
        if (!valid()) return;
        // Preserve object identity for unchanged responses, avoiding list/image churn.
        const same = JSON.stringify(data) === JSON.stringify(entry.state.data);
        entry.state = { data: same ? entry.state.data : data, error: '', loading: false, updatedAt: now() };
        entry.retryAt = 0; emit(entry, true);
      } catch (error) {
        if (!valid()) return;
        const status = (error as { status?: number }).status;
        entry.state = { ...entry.state, data: status === 401 || status === 403 || entry.scope === 'public' && (status === 400 || status === 404) ? null : entry.state.data,
          error: (error as Error).message || 'Unable to load this page.', loading: false };
        entry.retryAt = now() + 30_000; emit(entry, entry.state.data === null);
      } finally {
        if (entry.generation === generation) { entry.pending = undefined; entry.controller = undefined; collect(); }
      }
    });
    return entry.pending;
  }
  return {
    load,
    get<T>(path: string, scope: string): QuerySnapshot<T> {
      const entry = ensure(path, scope);
      // Do not notify React subscribers while another component reads its snapshot.
      if (entry.state.updatedAt !== null && now() - entry.state.updatedAt > queryPolicy(entry.path).maxAgeMs) {
        entry.state = EMPTY; setTimeout(() => emit(entry, true), 0);
      }
      return entry.state as QuerySnapshot<T>;
    },
    subscribe(path: string, scope: string, listener: () => void) {
      const entry = ensure(path, scope); entry.listeners.add(listener);
      return () => { entry.listeners.delete(listener); collect(); };
    },
    observe(path: string, scope: string, maxStaleMs?: number) {
      const entry = ensure(path, scope), observer = { maxStaleMs };
      entry.observers.add(observer); entry.active = entry.observers.size;
      return () => {
        entry.observers.delete(observer); entry.active = entry.observers.size;
        setTimeout(() => {
          if (!entry.active && entry.pending) {
            entry.generation++; entry.controller?.abort(); entry.pending = undefined;
            entry.state = { ...entry.state, loading: false }; emit(entry);
          }
          collect();
        }, 100);
      };
    },
    refreshActive(reconnected = false) {
      for (const entry of entries.values()) if (entry.active) {
        // Resume/reconnection repairs failed or invalidated reads. Retained data
        // is checked at its next screen use or explicit refresh, not every resume.
        if (entry.state.data !== null && !entry.state.error && entry.state.updatedAt !== null &&
          now() - entry.state.updatedAt < queryPolicy(entry.path).maxAgeMs) continue;
        if (reconnected) entry.retryAt = 0;
        const maxStaleMs = Math.min(...[...entry.observers].map(observer => observer.maxStaleMs ?? Infinity));
        void load(entry.path, entry.scope, false, maxStaleMs);
      }
    },
    cancelAll() {
      for (const entry of entries.values()) if (entry.pending) {
        entry.generation++; entry.controller?.abort(); entry.pending = undefined;
        entry.state = { ...entry.state, loading: false }; emit(entry);
      }
    },
    set<T>(path: string, scope: string, update: T | ((data: T) => T), fresh = true) {
      const entry = ensure(path, scope);
      if (typeof update === 'function' && entry.state.data === null) return;
      entry.generation++; entry.controller?.abort(); entry.pending = undefined;
      const data = typeof update === 'function' ? (update as (data: T) => T)(entry.state.data as T) : update;
      entry.state = { data, error: '', loading: false, updatedAt: fresh ? now() : entry.state.updatedAt };
      entry.retryAt = 0; emit(entry, true); collect();
    },
    patch<T>(predicate: (path: string, scope: string) => boolean, update: (data: T) => T) {
      for (const entry of entries.values()) if (entry.state.data !== null && predicate(entry.path, entry.scope)) {
        const data = update(entry.state.data as T);
        if (data === entry.state.data) continue;
        entry.generation++; entry.controller?.abort(); entry.pending = undefined;
        // Partial responses do not renew freshness for the rest of a snapshot.
        entry.state = { ...entry.state, data, error: '', loading: false };
        entry.retryAt = 0; emit(entry, true);
      }
      collect();
    },
    invalidate(predicate: (path: string, scope: string) => boolean, remove = false) {
      for (const entry of entries.values()) if (predicate(entry.path, entry.scope)) {
        if (remove) drop(entry);
        else {
          entry.generation++; entry.controller?.abort(); entry.pending = undefined;
          entry.state = { ...entry.state, updatedAt: null, loading: false }; entry.retryAt = 0; emit(entry, true);
        }
      }
    },
    clearPrivate() { for (const entry of entries.values()) if (entry.scope !== 'public') drop(entry); },
    export(scope: string): SavedQuery[] {
      return [...entries.values()].filter(entry => entry.scope === scope && entry.state.data !== null && entry.state.updatedAt !== null)
        .sort((a, b) => b.touched - a.touched).map(entry => ({ path: entry.path, scope, data: entry.state.data, updatedAt: entry.state.updatedAt! }));
    },
    restore(rows: SavedQuery[], scope: string) {
      for (const row of rows) {
        if (!row || row.scope !== scope || typeof row.path !== 'string' || !row.path.startsWith('/') ||
          publicQuery(row.path) !== (scope === 'public') || !Number.isFinite(row.updatedAt) || row.updatedAt > now() || now() - row.updatedAt > queryPolicy(row.path).maxAgeMs) continue;
        const entry = ensure(row.path, scope);
        if (entry.state.updatedAt !== null || entry.pending) continue;
        entry.state = { data: row.data, error: '', loading: false, updatedAt: row.updatedAt }; emit(entry);
      }
      collect();
    },
    onChange(listener: () => void) { changes.add(listener); return () => { changes.delete(listener); }; },
  };
}
