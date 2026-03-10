import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState } from "react";
const CartContext = createContext(null);
export function CartProvider({ children }) {
    const [items, setItems] = useState([]);
    const restaurantId = items.length > 0 ? items[0].restaurantId : null;
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const itemCount = items.reduce((s, i) => s + i.quantity, 0);
    const addItem = (item) => {
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
    const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
    const updateQuantity = (id, quantity) => {
        if (quantity <= 0)
            return removeItem(id);
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
    };
    const clearCart = () => setItems([]);
    return (_jsx(CartContext.Provider, { value: { items, addItem, removeItem, updateQuantity, clearCart, total, itemCount, restaurantId }, children: children }));
}
export const useCart = () => useContext(CartContext);
//# sourceMappingURL=cart.js.map