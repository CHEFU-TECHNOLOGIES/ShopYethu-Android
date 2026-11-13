export type DraftStorage = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
};
type Manifest = { slot: 0 | 1; counts: [number, number] };

async function settleWrites(operations: Promise<unknown>[]) {
  // Do not let a rejected chunk release the queue while other native writes are running.
  const outcomes = await Promise.allSettled(operations);
  const failure = outcomes.find(outcome => outcome.status === 'rejected');
  if (failure?.status === 'rejected') throw failure.reason;
}

// Two slots let a failed save leave the last complete draft readable.
// Small chunks also avoid SecureStore's historical iOS value-size limit.
export function createApplicationDraftStore(storage: DraftStorage) {
  const queues = new Map<string, Promise<unknown>>();
  function serial<T>(key: string, work: () => Promise<T>): Promise<T> {
    const previous = queues.get(key) || Promise.resolve();
    const next = previous.catch(() => undefined).then(work);
    queues.set(key, next);
    void next.finally(() => { if (queues.get(key) === next) queues.delete(key); }).catch(() => undefined);
    return next;
  }
  async function manifest(key: string): Promise<Manifest | null> {
    const raw = await storage.getItemAsync(key);
    if (!raw) return null;
    const value = JSON.parse(raw) as Manifest;
    if (![0, 1].includes(value.slot) || !Array.isArray(value.counts) || value.counts.length !== 2 ||
      value.counts.some(count => !Number.isInteger(count) || count < 0 || count > 65)) throw new Error('Invalid saved draft.');
    return value;
  }
  return {
    read: (key: string) => serial(key, async (): Promise<unknown | null> => {
      const meta = await manifest(key);
      if (!meta) return null;
      const chunks = await Promise.all(Array.from({ length: meta.counts[meta.slot] }, (_, index) => storage.getItemAsync(`${key}.${meta.slot}.${index}`)));
      if (!chunks.length || chunks.some(chunk => chunk === null)) throw new Error('Incomplete saved draft.');
      return JSON.parse(chunks.join(''));
    }),
    write: (key: string, value: unknown) => serial(key, async () => {
      const raw = JSON.stringify(value);
      if (!raw || raw.length > 32768) throw new Error('The draft is too large to save.');
      const previous = await manifest(key);
      const slot = previous?.slot === 0 ? 1 : 0;
      const chunks: string[] = [];
      let chunk = '';
      for (const character of raw) {
        if (chunk.length + character.length > 512) { chunks.push(chunk); chunk = ''; }
        chunk += character;
      }
      if (chunk) chunks.push(chunk);
      await settleWrites(chunks.map((chunk, index) => storage.setItemAsync(`${key}.${slot}.${index}`, chunk)));
      const counts: [number, number] = previous ? [...previous.counts] : [0, 0];
      // Remove trailing chunks before publishing this slot to readers.
      await settleWrites(Array.from({ length: Math.max(0, counts[slot] - chunks.length) }, (_, index) => storage.deleteItemAsync(`${key}.${slot}.${chunks.length + index}`)));
      counts[slot] = chunks.length;
      await storage.setItemAsync(key, JSON.stringify({ slot, counts }));
    }),
    clear: (key: string) => serial(key, async () => {
      // Also remove chunks from interrupted saves, even if their manifest was never committed.
      const keys = [0, 1].flatMap(slot => Array.from({ length: 65 }, (_, index) => `${key}.${slot}.${index}`));
      await settleWrites(keys.map(part => storage.deleteItemAsync(part)));
      await storage.deleteItemAsync(key);
    }),
  };
}
