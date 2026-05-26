import type { Product, Order, OrderItem, ProductKey, User } from "@prisma/client";

export type { Product, Order, OrderItem, ProductKey, User };

export type OrderWithItems = Order & {
  items: (OrderItem & {
    product: Product;
    key?: ProductKey | null;
  })[];
  user?: User | null;
  agent?: User | null;
};

export type ProductWithKeyCount = Product & {
  _count: { keys: number };
  availableKeys?: number;
};

export type CartItem = {
  productId: string;
  variant?: "key" | "account";
  variantId?: string;
  variantName?: string;
  name: string;
  price: number;
  discountPrice?: number | null;
  imageUrl?: string | null;
  platform: string;
  quantity: number;
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      avatarUrl?: string | null;
    };
  }
}
