import type { Product } from '@/types/marketplace';
export type CartLine = { product: Product; quantity: number };
export type OrderAttempt = { key: string; body: string };
type State = { uid: string | null; items: CartLine[]; attempt: OrderAttempt | null; ready: boolean; error: string };
type Storage = { read: (key: string) => Promise<unknown>; write: (key: string, data: unknown) => Promise<void>; clear: (key: string) => Promise<void> };
const KEY = 'shopyethu.basket.v1';
export function createCartStore(storage: Storage) {
  let state: State = { uid: null, items: [], attempt: null, ready: false, error: '' }, version = 0;
  let pending = Promise.resolve(), timer: ReturnType<typeof setTimeout> | undefined;
  let activating: string | null | undefined;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach(listener => listener());
  function persist() {
    clearTimeout(timer); timer = undefined;
    if (!state.ready || !state.uid) return pending;
    const value = { version: 1, uid: state.uid, items: state.items.map(line => ({ ...line,
      product: { ...line.product, description: '', photos: [] } })), attempt: state.attempt };
    pending = pending.catch(() => undefined).then(() => storage.write(KEY, value));
    return pending;
  }
  return {
    get: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    async activate(uid: string | null) {
      if (state.uid === uid && (state.ready || activating === uid)) return;
      activating = uid;
      const previous = state.uid, epoch = ++version;
      clearTimeout(timer);
      state = { uid, items: [], attempt: null, ready: false, error: '' }; emit();
      if (previous) pending = pending.catch(() => undefined).then(() => storage.clear(KEY));
      try {
        await pending;
        const saved = uid ? await storage.read(KEY) as { version: number; uid: string; items: CartLine[]; attempt: OrderAttempt | null } | null : null;
        if (epoch !== version) return;
        if (saved && (saved.version !== 1 || saved.uid !== uid)) await storage.clear(KEY);
        if (saved?.version === 1 && saved.uid === uid && Array.isArray(saved.items)) {
          const items = saved.items.slice(0, 30).filter(line => line?.product?.id && typeof line.product.storeId === 'string' &&
            Number.isInteger(line.quantity) && line.quantity > 0 && line.quantity <= 99 && Number.isInteger(line.product.priceCents) && Array.isArray(line.product.fulfilment));
          if (items.length !== saved.items.length) throw new Error('Invalid basket.');
          const attempt = saved.attempt && typeof saved.attempt.key === 'string' && typeof saved.attempt.body === 'string' ? saved.attempt : null;
          state = { uid, items, attempt, ready: true, error: '' };
        } else state = { ...state, ready: true };
        if (!uid) await storage.clear(KEY);
      } catch { if (epoch === version) state = { ...state, error: 'Your saved basket could not be opened. Try reopening the app before placing another order.' }; }
      if (epoch === version) { activating = undefined; emit(); }
    },
    change(update: (lines: CartLine[]) => CartLine[]) {
      if (!state.ready || !state.uid) throw new Error('Your basket is still opening. Please wait.');
      if (state.attempt) throw new Error('Confirm your previous order attempt before changing this basket.');
      state = { ...state, items: update(state.items) }; emit();
      clearTimeout(timer); timer = setTimeout(() => { void persist().catch(() => {
        state = { ...state, error: 'Your basket could not be saved on this device.' }; emit();
      }); }, 500);
    },
    async reserve(attempt: OrderAttempt) {
      const epoch = version;
      state = { ...state, attempt }; emit();
      await persist(); // Persist the idempotency key before any order can reach the server.
      if (epoch !== version) throw new Error('Your account changed. Please retry.');
    },
    async complete() { state = { ...state, items: [], attempt: null }; emit(); await persist(); },
    async reject() { state = { ...state, attempt: null }; emit(); await persist(); },
    flush: persist,
  };
}
