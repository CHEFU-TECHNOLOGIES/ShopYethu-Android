import { createContext, useContext, useRef, type ReactNode } from 'react';
import { randomUUID } from 'expo-crypto';
import type { Fulfilment, Order, Product } from '@/types/marketplace';
import { useAuth } from './auth';
import { useDraft } from '@/hooks/use-draft';
import { api } from './api';

export type CartLine = { product: Product; quantity: number };
type Cart = { items: CartLine[]; add: (product: Product) => void; quantity: (id: string, amount: number) => void; checkout: (fulfilment: Fulfilment, contact: string, address: string) => Promise<Order>; refreshPrices: () => Promise<void> };
const Context = createContext<Cart | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const uid = session?.user.uid;
  const [lines, setLines] = useDraft<CartLine[]>(uid || 'guest', []);
  const attempt = useRef<{ key: string; body: string } | null>(null);
  const locked = useRef(false);
  const items = lines;
  function add(product: Product) {
    if (!uid) throw new Error('Sign in from Account before adding to your basket.');
    if (locked.current) throw new Error('Your order is submitting. Please wait.');
    if (items.length && items[0].product.storeId !== product.storeId) throw new Error('Place your current store’s order first. Each order supports one store.');
    if (product.stock < 1) throw new Error('This product is sold out.');
    attempt.current = null;
    setLines(current => {
      const existing = current.find(line => line.product.id === product.id);
      return existing ? current.map(line => line.product.id === product.id ? { ...line, quantity: Math.min(line.quantity + 1, product.stock) } : line) : [...current, { product, quantity: 1 }];
    });
  }
  function quantity(id: string, amount: number) {
    if (locked.current) return;
    attempt.current = null;
    setLines(current => current.map(line => line.product.id === id ? { ...line, quantity: Math.min(amount, line.product.stock) } : line).filter(line => line.quantity > 0));
  }
  async function refreshPrices() {
    if (locked.current) return;
    const updated = await Promise.all(items.map(async line => ({ ...line, product: (await api<{ product: Product }>(`/products/${line.product.id}`)).product })));
    setLines(updated); attempt.current = null;
  }
  async function checkout(fulfilment: Fulfilment, contact: string, address: string) {
    if (!uid || !items.length) throw new Error('Your basket is empty or your session has ended.');
    if (locked.current) throw new Error('Your order is already submitting.');
    const body = JSON.stringify({ items: items.map(line => ({ productId: line.product.id, quantity: line.quantity, expectedPriceCents: line.product.priceCents })), fulfilment, contact, address });
    if (!attempt.current || attempt.current.body !== body) attempt.current = { key: randomUUID(), body };
    locked.current = true;
    try {
      const order = await api<Order>('/orders', { method: 'POST', body, headers: { 'Idempotency-Key': attempt.current.key } });
      setLines([]); attempt.current = null; return order;
    } finally { locked.current = false; }
  }
  return <Context.Provider value={{ items, add, quantity, checkout, refreshPrices }}>{children}</Context.Provider>;
}
export function useCart() { const value = useContext(Context); if (!value) throw new Error('CartProvider is required.'); return value; }
