import type { Product } from '@/types/marketplace';
export type CartLine = { product: Product; quantity: number };
export type OrderAttempt = { key: string; body: string };
type State = { uid: string | null; items: CartLine[]; alternates: CartLine[][]; attempt: OrderAttempt | null; ready: boolean; error: string };
type PersistedBasket = { version: number; uid: string | null; items: CartLine[]; alternates?: CartLine[][]; attempt: OrderAttempt | null };
type Storage = { read: (key: string) => Promise<unknown>; write: (key: string, data: unknown) => Promise<void>; clear: (key: string) => Promise<void> };
const KEY = 'shopyethu.basket.v1';
const GUEST_KEY = 'shopyethu.guest-basket.v1';
const accountKey = (uid: string) => `${KEY}.${encodeURIComponent(uid)}`;

function storedLines(value: unknown): CartLine[] {
  if (!Array.isArray(value) || value.length > 30) throw new Error('Invalid basket.');
  const lines = value as CartLine[];
  if (lines.some(line => !line?.product?.id || typeof line.product.storeId !== 'string' ||
    !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99 ||
    !Number.isInteger(line.product.priceCents) || !Array.isArray(line.product.fulfilment)) ||
    new Set(lines.map(line => line.product.id)).size !== lines.length ||
    new Set(lines.map(line => line.product.storeId)).size > 1) throw new Error('Invalid basket.');
  return lines;
}

function compactLines(lines: CartLine[]) {
  return lines.map(line => ({ ...line, product: { ...line.product, description: '', photos: [] } }));
}

function sameBasket(left: CartLine[], right: CartLine[]) {
  return left.length === right.length && left.every(line => {
    const match = right.find(item => item.product.id === line.product.id);
    return match?.quantity === line.quantity;
  });
}

function canMerge(left: CartLine[], right: CartLine[]) {
  return left.length + right.length <= 60 &&
    (!left.length || !right.length || left[0].product.storeId === right[0].product.storeId) &&
    new Set([...left, ...right].map(line => line.product.id)).size <= 30;
}

function mergeLines(left: CartLine[], right: CartLine[]) {
  const merged = new Map(left.map(line => [line.product.id, line]));
  for (const line of right) {
    const current = merged.get(line.product.id);
    if (!current) merged.set(line.product.id, line);
    else {
      const product = line.product.updatedAt > current.product.updatedAt ? line.product : current.product;
      merged.set(line.product.id, { product, quantity: Math.min(99, current.quantity + line.quantity) });
    }
  }
  return [...merged.values()];
}

export function createCartStore(storage: Storage) {
  let state: State = { uid: null, items: [], alternates: [], attempt: null, ready: false, error: '' }, version = 0;
  let pending = Promise.resolve(), timer: ReturnType<typeof setTimeout> | undefined;
  let activating: string | null | undefined;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach(listener => listener());
  function persist() {
    clearTimeout(timer); timer = undefined;
    if (!state.ready) return pending;
    const key = state.uid ? accountKey(state.uid) : GUEST_KEY;
    const value = { version: 2, uid: state.uid, items: compactLines(state.items),
      alternates: state.uid ? state.alternates.map(compactLines) : [], attempt: state.attempt };
    pending = pending.catch(() => undefined).then(() => storage.write(key, value));
    return pending;
  }
  return {
    get: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    async activate(uid: string | null) {
      if (state.uid === uid && (state.ready || activating === uid)) return;
      activating = uid;
      const previousReady = state.ready;
      const epoch = ++version;
      try {
        if (previousReady) await persist();
        if (epoch !== version) return;
        clearTimeout(timer);
        state = { uid, items: [], alternates: [], attempt: null, ready: false, error: '' }; emit();
        await pending;
        const key = uid ? accountKey(uid) : GUEST_KEY;
        let saved = await storage.read(key) as PersistedBasket | null;
        let migrateLegacy = false;
        if (uid && !saved) {
          const legacy = await storage.read(KEY) as PersistedBasket | null;
          if (legacy?.uid === uid) { saved = legacy; migrateLegacy = true; }
        }
        if (epoch !== version) return;
        let items: CartLine[] = [], alternates: CartLine[][] = [], attempt: OrderAttempt | null = null;
        if (saved) {
          if (![1, 2].includes(saved.version) || saved.uid !== uid) {
            await storage.clear(key);
            throw new Error('Your saved basket belongs to a different account or app version.');
          }
          items = storedLines(saved.items);
          if (uid && saved.version === 2) {
            if (saved.alternates !== undefined && !Array.isArray(saved.alternates)) throw new Error('Invalid saved baskets.');
            alternates = (saved.alternates || []).map(storedLines);
          }
          attempt = saved.attempt && typeof saved.attempt.key === 'string' && typeof saved.attempt.body === 'string' ? saved.attempt : null;
        }

        let guestNeedsClear = false;
        if (uid) {
          const guest = await storage.read(GUEST_KEY) as { version: number; uid: string | null; items: CartLine[] } | null;
          if (guest) {
            if (guest.version !== 2 || guest.uid !== null) {
              await storage.clear(GUEST_KEY);
              throw new Error('Your saved guest basket could not be opened.');
            }
            const guestItems = storedLines(guest.items);
            if (guestItems.length) {
              if (!items.length && !attempt) items = guestItems;
              else if (!sameBasket(items, guestItems)) {
                if (!attempt && canMerge(items, guestItems)) items = mergeLines(items, guestItems);
                else if (!alternates.some(alternate => sameBasket(alternate, guestItems))) alternates.push(guestItems);
              }
              guestNeedsClear = true;
            } else guestNeedsClear = true;
          }
        }

        if (epoch !== version) return;
        state = { uid, items, alternates, attempt, ready: true, error: '' };
        if (guestNeedsClear) {
          await persist();
          await storage.clear(GUEST_KEY);
        } else if ((saved?.version === 1 || migrateLegacy) && uid) {
          await persist();
        }
        if (migrateLegacy) await storage.clear(KEY);
      } catch { if (epoch === version) state = { ...state, error: 'Your saved basket could not be opened. Try reopening the app before placing another order.' }; }
      if (epoch === version) { activating = undefined; emit(); }
    },
    change(update: (lines: CartLine[]) => CartLine[]) {
      if (activating !== undefined && state.uid !== activating) throw new Error('Your account is changing. Please wait.');
      if (!state.ready) throw new Error('Your basket is still opening. Please wait.');
      if (state.attempt) throw new Error('Confirm your previous order attempt before changing this basket.');
      state = { ...state, items: update(state.items) }; emit();
      clearTimeout(timer); timer = setTimeout(() => { void persist().catch(() => {
        state = { ...state, error: 'Your basket could not be saved on this device.' }; emit();
      }); }, 500);
    },
    async switchAlternative(index: number) {
      if (activating !== undefined && state.uid !== activating) throw new Error('Your account is changing. Please wait.');
      if (!state.uid || !state.ready || state.attempt || !state.alternates[index]) {
        throw new Error('This saved basket cannot be switched right now.');
      }
      const alternates = state.alternates.slice();
      const currentItems = state.items;
      state = { ...state, items: alternates[index], alternates: alternates.map((items, itemIndex) => itemIndex === index ? currentItems : items) };
      emit();
      await persist();
    },
    async reserve(attempt: OrderAttempt) {
      if (!state.uid) throw new Error('Sign in before placing your order.');
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
