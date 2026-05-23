import { api } from "./client";
import type { Order } from "@/types";

export interface CreateOrderPayload {
  email: string;
  paymentMethod: string;
  totalAmount: number;
  items: { productId: string; quantity: number; unitPrice: number }[];
}

export async function createOrder(payload: CreateOrderPayload): Promise<{ orderNumber: string }> {
  return api.post("/api/orders", payload);
}

export async function getMyOrders(): Promise<Order[]> {
  return api.get("/api/mobile/orders");
}

export async function getOrderByNumber(orderNumber: string): Promise<Order> {
  return api.get(`/api/mobile/orders/${orderNumber}`);
}
