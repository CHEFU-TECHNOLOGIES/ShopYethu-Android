import type { SavedQuery, createQueryCache } from './query-cache';
type Cache = ReturnType<typeof createQueryCache>;
type Storage = { read: (key: string) => Promise<unknown>; write: (key: string, data: unknown) => Promise<void>; clear: (key: string) => Promise<void> };
type Envelope = { version: 1; scope: string; rows: SavedQuery[] };
const PUBLIC_KEY = 'shopyethu.cache.public.v1', PRIVATE_KEY = 'shopyethu.cache.account.v1';

export function createQueryPersistence(cache: Cache, storage: Storage) {
  let scope: string | null = null, version = 0, initialized = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending = Promise.resolve();
  let publicReady: Promise<void> | undefined, privateReady = Promise.resolve();
  const saved = new Map<string, string>();
  async function restore(key: string, expected: string, epoch: number) {
    try {
      const value = await storage.read(key) as Envelope | null;
      if (!value) return;
      if (value.version !== 1 || value.scope !== expected || !Array.isArray(value.rows)) { await storage.clear(key); return; }
      if (expected === 'public' || epoch === version && scope === expected) cache.restore(value.rows.slice(0, 60), expected);
    } catch { /* A cache failure must never block shopping or sign-in. */ }
  }
  function envelope(target: string): Envelope {
    const result: Envelope = { version: 1, scope: target, rows: [] };
    for (const row of cache.export(target)) {
      // Save complete snapshots only; truncating a list would misrepresent its contents.
      if (JSON.stringify({ ...result, rows: [...result.rows, row] }).length <= 30_000) result.rows.push(row);
    }
    return result;
  }
  async function flush() {
    clearTimeout(timer); timer = undefined;
    await Promise.all([publicReady, privateReady]);
    for (const target of ['public', ...(scope ? [scope] : [])]) {
      const value = envelope(target), raw = JSON.stringify(value);
      if (saved.get(target) === raw) continue;
      saved.set(target, raw);
      const key = target === 'public' ? PUBLIC_KEY : PRIVATE_KEY;
      pending = pending.catch(() => undefined).then(() => storage.write(key, value)).catch(() => { saved.delete(target); });
    }
    return pending;
  }
  const stop = cache.onChange(() => { if (!timer) timer = setTimeout(() => { void flush(); }, 10_000); });
  return {
    activate(next: string | null) {
      if (!publicReady) publicReady = restore(PUBLIC_KEY, 'public', version);
      if (next === scope && initialized) return Promise.all([publicReady, privateReady]);
      initialized = true;
      const previous = scope; scope = next; version++; saved.clear();
      if (previous) pending = pending.catch(() => undefined).then(() => storage.clear(PRIVATE_KEY)).catch(() => undefined);
      const epoch = version;
      privateReady = pending.then(async () => {
        if (next && epoch === version) await restore(PRIVATE_KEY, next, epoch);
        else if (!next) await storage.clear(PRIVATE_KEY).catch(() => undefined);
      });
      return Promise.all([publicReady, privateReady]);
    },
    flush,
    dispose() { clearTimeout(timer); stop(); },
  };
}
