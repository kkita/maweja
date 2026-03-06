import { createContext, useContext, useState, type ReactNode } from "react";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  restaurantId: number;
  restaurantName: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  restaurantId: number | null;
}

const CartContext = createContext<CartContextType>(null!);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const restaurantId = items.length > 0 ? items[0].restaurantId : null;
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  const addItem = (item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      if (prev.length > 0 && prev[0].restaurantId !== item.restaurantId) {
        return [{ ...item, quantity: 1 }];
      }
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id: number) => setItems((prev) => prev.filter((i) => i.id !== id));
  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) return removeItem(id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  };
  const clearCart = () => setItems([]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount, restaurantId }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
