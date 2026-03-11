import { type ReactNode } from "react";
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
export declare function CartProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare const useCart: () => CartContextType;
export {};
//# sourceMappingURL=cart.d.ts.map