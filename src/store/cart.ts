import { atom } from 'nanostores';

export interface CartItem {
  id: string;         // DB CartItem id
  productId: string;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  qty: number;
  dimension: number;
  options: Record<string, { id: string; name: string; priceAdj: number }>;
  designUrl?: string;
}

// In-memory atom for reactivity — populated by fetching /api/cart
export const cartItems = atom<CartItem[]>([]);
export const cartLoading = atom<boolean>(false);

export async function loadCart() {
  cartLoading.set(true);
  try {
    const res = await fetch('/api/cart');
    if (res.ok) {
      const data = await res.json();
      cartItems.set(data);
    }
  } finally {
    cartLoading.set(false);
  }
}

export async function addToCart(item: Omit<CartItem, 'id'> & { productId: string }) {
  const res = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (res.status === 401) {
    window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
    return;
  }
  if (res.ok) {
    await loadCart();
  }
  return res;
}

export async function updateQty(cartItemId: string, newQty: number) {
  if (newQty < 1) return;
  const res = await fetch(`/api/cart/${cartItemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qty: newQty }),
  });
  if (res.ok) {
    cartItems.set(cartItems.get().map(i => i.id === cartItemId ? { ...i, qty: newQty } : i));
  }
}

export async function removeFromCart(cartItemId: string) {
  const res = await fetch(`/api/cart/${cartItemId}`, { method: 'DELETE' });
  if (res.ok) {
    cartItems.set(cartItems.get().filter(i => i.id !== cartItemId));
  }
}

export async function clearCart() {
  await fetch('/api/cart', { method: 'DELETE' });
  cartItems.set([]);
}
