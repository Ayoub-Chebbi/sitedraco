export interface User {
  id: string;
  email: string;
  name: string | null;
  role: "customer" | "admin" | "support";
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  platform: string;
  category: string;
  productType: "key" | "account" | "both";
  price: number;
  discountPrice: number | null;
  accountPrice: number | null;
  accountDiscountPrice: number | null;
  imageUrl: string | null;
  isActive: boolean;
  soldCount: number;
  rating: number;
  reviewCount: number;
  urgencyHours: number;
  _count: { keys: number };
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product: Pick<Product, "id" | "name" | "imageUrl" | "platform">;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: "pending" | "processing" | "delivered" | "cancelled" | "refunded";
  paymentMethod: string | null;
  paymentStatus: "pending" | "paid" | "failed";
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  createdAt: string;
  messages: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  message: string;
  createdAt: string;
  sender: Pick<User, "id" | "name" | "email" | "role">;
}

export interface CartItem {
  product: Product;
  variant?: "key" | "account";
  quantity: number;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  price: number;
  discountPrice: number | null;
  href: string;
  gradient: string;
}
