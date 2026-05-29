import { create } from "zustand";
import type { CartItem, Product, ProductVariant } from "@/types";

interface CartState {
  items: CartItem[];
  add: (product: Product, quantity?: number, variant?: "key" | "account", customVariant?: ProductVariant) => void;
  remove: (productId: string, variant?: "key" | "account", variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variant?: "key" | "account", variantId?: string) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
}

function itemPrice(item: CartItem): number {
  if (item.variantPrice !== undefined) return item.variantPrice;
  if (item.variant === "account") {
    return item.product.accountDiscountPrice ?? item.product.accountPrice ?? item.product.price;
  }
  return item.product.discountPrice ?? item.product.price;
}

function matches(i: CartItem, productId: string, variant?: "key" | "account", variantId?: string) {
  return i.product.id === productId && i.variant === variant && i.variantId === variantId;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  add: (product, quantity = 1, variant, customVariant) => {
    const variantId = customVariant?.id;
    const variantPrice = customVariant
      ? (customVariant.discountPrice ?? customVariant.price)
      : undefined;
    const variantName = customVariant?.name;

    set((state) => {
      const existing = state.items.find((i) => matches(i, product.id, variant, variantId));
      if (existing) {
        return {
          items: state.items.map((i) =>
            matches(i, product.id, variant, variantId)
              ? { ...i, quantity: i.quantity + quantity }
              : i
          ),
        };
      }
      return {
        items: [...state.items, { product, variant, variantId, variantName, variantPrice, quantity }],
      };
    });
  },

  remove: (productId, variant, variantId) => {
    set((state) => ({
      items: state.items.filter((i) => !matches(i, productId, variant, variantId)),
    }));
  },

  updateQuantity: (productId, quantity, variant, variantId) => {
    if (quantity <= 0) {
      get().remove(productId, variant, variantId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        matches(i, productId, variant, variantId) ? { ...i, quantity } : i
      ),
    }));
  },

  clear: () => set({ items: [] }),

  total: () => get().items.reduce((sum, i) => sum + itemPrice(i) * i.quantity, 0),

  count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
