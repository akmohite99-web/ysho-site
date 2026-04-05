import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  productId: string;
  name: string;
  variant: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  updateQuantity: (productId: string, variant: string, quantity: number) => void;
  removeFromCart: (productId: string, variant: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_KEY = "ysho_cart";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const sameItem = (a: CartItem, b: Omit<CartItem, "quantity">) =>
    a.productId === b.productId && a.variant === b.variant;

  const addToCart = (newItem: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => sameItem(i, newItem));
      if (existing) {
        return prev.map((i) => sameItem(i, newItem) ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, variant: string, quantity: number) => {
    if (quantity < 1) return removeFromCart(productId, variant);
    setItems((prev) =>
      prev.map((i) => (i.productId === productId && i.variant === variant ? { ...i, quantity } : i))
    );
  };

  const removeFromCart = (productId: string, variant: string) => {
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.variant === variant)));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalAmount = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, totalItems, totalAmount, addToCart, updateQuantity, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
