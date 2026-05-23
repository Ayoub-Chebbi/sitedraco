import { api } from "./client";
import type { SupportTicket } from "@/types";

export async function getMyTickets(): Promise<SupportTicket[]> {
  return api.get("/api/tickets");
}

export async function getTicket(id: string): Promise<SupportTicket> {
  return api.get(`/api/tickets/${id}`);
}

export async function createTicket(subject: string, message: string, category = "general"): Promise<SupportTicket> {
  return api.post("/api/tickets", { subject, message, category });
}

export async function replyToTicket(ticketId: string, message: string): Promise<void> {
  await api.post(`/api/tickets/${ticketId}/messages`, { message });
}
