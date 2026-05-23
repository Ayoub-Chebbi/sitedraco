import { api } from "./client";

export type AdminStats = {
  totalOrders: number;
  monthOrders: number;
  totalRevenue: number;
  monthRevenue: number;
  totalUsers: number;
  newUsersMonth: number;
  totalProducts: number;
  openTickets: number;
  pendingOrders: number;
};

export type AdminOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  notesInternal?: string;
  createdAt: string;
  user: { id: string; email: string; name?: string };
  items: { id: string; quantity: number; unitPrice: number; product: { name: string } }[];
};

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  platform: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
  _count: { keys: number };
};

export type SupportTicket = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  resolvedAt?: string;
  agentId?: string;
  user: { id: string; email: string; name?: string };
  messages: {
    id: string;
    message: string;
    createdAt: string;
    sender: { id: string; name?: string; email: string; role: string };
  }[];
};

export async function getAdminStats(): Promise<AdminStats> {
  return api.get("/api/mobile/admin/stats");
}

export async function getAdminOrders(params?: { status?: string; page?: number }): Promise<{
  orders: AdminOrder[];
  total: number;
  page: number;
  limit: number;
}> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.page) qs.set("page", String(params.page));
  const query = qs.toString();
  return api.get(`/api/mobile/admin/orders${query ? `?${query}` : ""}`);
}

export async function updateOrderStatus(
  id: string,
  data: { status?: string; paymentStatus?: string; notesInternal?: string }
): Promise<AdminOrder> {
  return api.patch(`/api/mobile/admin/orders/${id}`, data);
}

export async function getAdminProducts(page?: number): Promise<{
  products: AdminProduct[];
  total: number;
}> {
  return api.get(`/api/mobile/admin/products${page ? `?page=${page}` : ""}`);
}

export async function getSupportTickets(status?: string): Promise<SupportTicket[]> {
  return api.get(`/api/mobile/support/tickets${status ? `?status=${status}` : ""}`);
}

export async function getSupportTicket(id: string): Promise<SupportTicket> {
  return api.get(`/api/mobile/support/tickets/${id}`);
}

export async function updateTicket(
  id: string,
  data: { status?: string; priority?: string }
): Promise<SupportTicket> {
  return api.patch(`/api/mobile/support/tickets/${id}`, data);
}
