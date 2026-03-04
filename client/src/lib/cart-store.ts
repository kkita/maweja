import { useSyncExternalStore, useCallback } from "react";
import type { CartItem, MenuItem } from "./demo-data";

let cartItems: CartItem[] = [];
let listeners: Set<() => void> = new Set();

function emitChange() {
  listeners.forEach(fn => fn());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function getSnapshot() {
  return cartItems;
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot);

  const addItem = useCallback((item: MenuItem, restaurantName: string) => {
    const existing = cartItems.find(c => c.menuItem.id === item.id);
    if (existing) {
      cartItems = cartItems.map(c =>
        c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
      );
    } else {
      cartItems = [...cartItems, { menuItem: item, quantity: 1, restaurantName }];
    }
    emitChange();
  }, []);

  const removeItem = useCallback((itemId: number) => {
    cartItems = cartItems.filter(c => c.menuItem.id !== itemId);
    emitChange();
  }, []);

  const updateQuantity = useCallback((itemId: number, quantity: number) => {
    if (quantity <= 0) {
      cartItems = cartItems.filter(c => c.menuItem.id !== itemId);
    } else {
      cartItems = cartItems.map(c =>
        c.menuItem.id === itemId ? { ...c, quantity } : c
      );
    }
    emitChange();
  }, []);

  const clearCart = useCallback(() => {
    cartItems = [];
    emitChange();
  }, []);

  const getSubtotal = useCallback(() => {
    return items.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0);
  }, [items]);

  const getTotalItems = useCallback(() => {
    return items.reduce((sum, c) => sum + c.quantity, 0);
  }, [items]);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTotalItems,
  };
}
