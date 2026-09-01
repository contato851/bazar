"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type CartItem = {
  id: string;
  nome: string;
  preco: number;
  foto: string | null;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  isInCart: (id: string) => boolean;
};

const STORAGE_KEY = "bazar-bia-cart";

const CartContext = createContext<CartContextValue | null>(null);

/**
 * Lista do cliente = estado local (localStorage), sem login — cada peça é
 * uma unidade só, então adicionar duas vezes a mesma peça não faz sentido
 * (é um brechó, não tem estoque). `items` é sempre um conjunto sem
 * duplicatas por `id`.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // localStorage indisponível (modo privado, etc.) — segue com lista vazia.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignora — pior caso, a lista não sobrevive a um refresh.
    }
  }, [items, hydrated]);

  const addItem = useCallback((item: CartItem) => {
    setItems((current) =>
      current.some((existing) => existing.id === item.id) ? current : [...current, item]
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const isInCart = useCallback((id: string) => items.some((item) => item.id === id), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clear, isInCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return context;
}
