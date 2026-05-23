import { create } from "zustand";
import type { CartItem, Product } from "@/types";

interface CartState {
  items: CartItem[];
  add: (product: Product, quantity?: number, variant?: "key" | "account") => void;
  remove: (productId: string, variant?: "key" | "account") => void;
  updateQuantity: (productId: string, quantity: number, variant?: "key" | "account") => void;
  clear: () => void;
  total: () => number;
  count: () => number;
}

function effectivePrice(item: CartItem): number {
  if (item.variant === "account") {
    return item.product.accountDiscountPrice ?? item.product.accountPrice ?? item.product.price;
  }
  return item.product.discountPrice ?? item.product.price;
}

function matches(i: CartItem, productId: string, variant?: "key" | "account") {
  return i.product.id === productId && i.variant === variant;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  add: (product, quantity = 1, variant) => {
    set((state) => {
      const existing = state.items.find((i) => matches(i, product.id, variant));
      if (existing) {
        return {
          items: state.items.map((i) =>
            matches(i, product.id, variant)
              ? { ...i, quantity: i.quantity + quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, { product, variant, quantity }] };
    });
  },

  remove: (productId, variant) => {
    set((state) => ({
      items: state.items.filter((i) => !matches(i, productId, variant)),
    }));
  },

  updateQuantity: (productId, quantity, variant) => {
    if (quantity <= 0) {
      get().remove(productId, variant);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        matches(i, productId, variant) ? { ...i, quantity } : i
      ),
    }));
  },

  clear: () => set({ items: [] }),

  total: () =>
    get().items.reduce((sum, i) => sum + effectivePrice(i) * i.quantity, 0),

  count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
