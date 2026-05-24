"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  total: () => number;
  count: () => number;
};

function sameItem(a: CartItem, b: CartItem) {
  return a.productId === b.productId && a.variant === b.variant && a.variantId === b.variantId;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find((i) => sameItem(i, item));
        if (existing) {
          set((state) => ({
            items: state.items.map((i) => sameItem(i, item) ? { ...i, quantity: i.quantity + 1 } : i),
          }));
        } else {
          set((state) => ({ items: [...state.items, { ...item, quantity: 1 }] }));
        }
      },
      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter((i) => !(i.productId === productId && i.variantId === variantId)),
        })),
      updateQuantity: (productId, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && i.variantId === variantId ? { ...i, quantity } : i
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      total: () =>
        get().items.reduce(
          (sum, item) => sum + (item.discountPrice ?? item.price) * item.quantity,
          0
        ),
      count: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    { name: "cart-storage" }
  )
);
