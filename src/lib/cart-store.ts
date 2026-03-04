import { MenuItem } from './demo-data';

export interface CartItem {
  item: MenuItem;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
}

type CartListener = () => void;

let cartItems: CartItem[] = [];
let listeners: CartListener[] = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribe(listener: CartListener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

export function getSnapshot(): CartItem[] {
  return cartItems;
}

export function addToCart(item: MenuItem, restaurantId: string, restaurantName: string) {
  const existing = cartItems.find(ci => ci.item.id === item.id);
  if (existing) {
    cartItems = cartItems.map(ci =>
      ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
    );
  } else {
    cartItems = [...cartItems, { item, quantity: 1, restaurantId, restaurantName }];
  }
  emitChange();
}

export function removeFromCart(itemId: string) {
  cartItems = cartItems.filter(ci => ci.item.id !== itemId);
  emitChange();
}

export function updateQuantity(itemId: string, quantity: number) {
  if (quantity <= 0) {
    removeFromCart(itemId);
    return;
  }
  cartItems = cartItems.map(ci =>
    ci.item.id === itemId ? { ...ci, quantity } : ci
  );
  emitChange();
}

export function clearCart() {
  cartItems = [];
  emitChange();
}

export function getCartTotal(): number {
  return cartItems.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);
}

export function getCartCount(): number {
  return cartItems.reduce((sum, ci) => sum + ci.quantity, 0);
}
