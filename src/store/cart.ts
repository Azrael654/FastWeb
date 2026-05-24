import { persistentAtom } from '@nanostores/persistent';

export interface CartItem {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  qty: number;
  dimension: number;
  options: Record<string, { id: string; priceAdj: number }>;
}

export const cartItems = persistentAtom<CartItem[]>('fp_cart', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export function addToCart(item: CartItem) {
  const current = cartItems.get();
  const existingIndex = current.findIndex(
    (c: CartItem) => c.id === item.id && JSON.stringify(c.options) === JSON.stringify(item.options)
  );

  if (existingIndex >= 0) {
    const newItems = [...current];
    newItems[existingIndex] = {
      ...newItems[existingIndex],
      qty: newItems[existingIndex].qty + item.qty,
    };
    cartItems.set(newItems);
  } else {
    cartItems.set([...current, item]);
  }
}

export function updateQty(index: number, newQty: number) {
  if (newQty < 1) return;
  const current = [...cartItems.get()];
  current[index] = { ...current[index], qty: newQty };
  cartItems.set(current);
}

export function removeFromCart(index: number) {
  const current = [...cartItems.get()];
  current.splice(index, 1);
  cartItems.set(current);
}

export function clearCart() {
  cartItems.set([]);
}
