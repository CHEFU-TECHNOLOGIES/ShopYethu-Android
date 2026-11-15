import { createContext, useContext, useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { randomUUID } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import type { Fulfilment, Order, Product } from '@/types/marketplace';
import { useAuth } from './auth';
import { currentSession, sessionRevision, subscribe } from './session';
import { api, ApiError } from './api';
import { createApplicationDraftStore } from './application-draft-store';
import { createCartStore } from './cart-store';
import { toast } from './toast';
export type { CartLine } from './cart-store';

const basket = createCartStore(createApplicationDraftStore(SecureStore));
subscribe(session => { void basket.activate(session?.user.uid || null); });
type Cart = { items: ReturnType<typeof basket.get>['items']; ready: boolean; error: string; pending: boolean;
  add: (product: Product) => void; quantity: (id: string, amount: number) => void;
  checkout: (fulfilment: Fulfilment, contact: string, address: string) => Promise<Order>; refreshPrices: () => Promise<void> };
const Context = createContext<Cart | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const { session, ready: authReady } = useAuth();
  const uid = session?.user.uid || null;
  const state = useSyncExternalStore(basket.subscribe, basket.get, basket.get);
  const locked = useRef(false);
  useEffect(() => { if (authReady) void basket.activate(uid); }, [authReady, uid]);
  useEffect(() => {
    const listener = AppState.addEventListener('change', status => { if (status !== 'active') void basket.flush().catch(() => undefined); });
    return () => listener.remove();
  }, []);
  function add(product: Product) {
    if (!uid) throw new Error('Sign in before adding to your basket.');
    if (locked.current) throw new Error('Your order is submitting. Please wait.');
    basket.change(items => {
      if (items.length && items[0].product.storeId !== product.storeId) throw new Error('Each order supports one store. Place your current order first.');
      if (product.stock < 1) throw new Error('This product is sold out.');
      const existing = items.find(line => line.product.id === product.id);
      if (existing && existing.quantity >= Math.min(product.stock, 99)) throw new Error('You have reached the available quantity.');
      if (!existing && items.length >= 30) throw new Error('A basket can contain up to 30 products.');
      return existing ? items.map(line => line.product.id === product.id ? { product, quantity: line.quantity + 1 } : line) : [...items, { product, quantity: 1 }];
    });
    toast.success('Added to your basket.');
  }
  function quantity(id: string, amount: number) {
    if (locked.current || !Number.isInteger(amount)) return;
    try {
      basket.change(items => items.map(line => line.product.id === id ? { ...line, quantity: Math.min(amount, line.product.stock, 99) } : line).filter(line => line.quantity > 0));
      if (amount <= 0) toast.info('Removed from your basket.');
    } catch (error) { toast.warning((error as Error).message); }
  }
  async function refreshPrices() {
    if (locked.current || state.attempt) return;
    const revision = sessionRevision(), original = basket.get().items;
    const updated = await Promise.all(original.map(async line => ({ ...line, product: (await api<{ product: Product }>(`/products/${line.product.id}`)).product })));
    if (revision !== sessionRevision() || original !== basket.get().items) return;
    basket.change(() => updated); toast.success('Prices and availability updated.');
  }
  async function checkout(fulfilment: Fulfilment, contact: string, address: string) {
    const snapshot = basket.get(), revision = sessionRevision();
    if (!uid || !snapshot.ready || !snapshot.items.length || currentSession()?.user.uid !== uid) throw new Error('Your basket is not ready or your session has ended.');
    if (locked.current) throw new Error('Your order is already submitting.');
    const body = JSON.stringify({ items: snapshot.items.map(line => ({ productId: line.product.id, quantity: line.quantity, expectedPriceCents: line.product.priceCents })), fulfilment, contact, address });
    const attempt = snapshot.attempt || { key: randomUUID(), body };
    locked.current = true;
    let sent = false;
    try {
      await basket.reserve(attempt);
      if (revision !== sessionRevision()) throw new Error('Your account changed. Please retry.');
      sent = true;
      const order = await api<Order>('/orders', { method: 'POST', body: attempt.body, headers: { 'Idempotency-Key': attempt.key } });
      if (revision === sessionRevision()) await basket.complete().catch(() => toast.warning('Order confirmed. Your saved basket could not be cleared.'));
      return order;
    } catch (error) {
      // A definite first-attempt rejection permits editing. An uncertain earlier send
      // retains its key, even if permissions changed before retrying it.
      if (sent && !snapshot.attempt && error instanceof ApiError && [400, 404, 409, 422].includes(error.status) && revision === sessionRevision()) await basket.reject();
      throw error;
    } finally { locked.current = false; }
  }
  const visible = state.uid === uid;
  return <Context.Provider value={{ items: visible ? state.items : [], ready: visible && state.ready,
    error: visible ? state.error : '', pending: visible && !!state.attempt, add, quantity, checkout, refreshPrices }}>{children}</Context.Provider>;
}
export function useCart() { const value = useContext(Context); if (!value) throw new Error('CartProvider is required.'); return value; }
