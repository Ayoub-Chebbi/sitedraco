import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TicketDetailClient } from "./ticket-detail-client";
import { ChevronRight } from "lucide-react";

export default async function AdminTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) redirect("/");

  const { id } = await params;

  const [ticket, agents] = await Promise.all([
    prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        agent: { select: { id: true, name: true, email: true } },
        order: { select: { id: true, orderNumber: true, status: true, totalAmount: true } },
        messages: {
          include: { sender: { select: { id: true, name: true, email: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["admin", "support"] } },
      select: { id: true, name: true, email: true },
    }),
  ]);

  if (!ticket) notFound();

  const serialized = {
    ...ticket,
    createdAt: ticket.createdAt.toISOString(),
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
    messages: ticket.messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <Link href="/admin" className="hover:text-gray-300">Admin</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/admin/tickets" className="hover:text-gray-300">Tickets</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-300 truncate max-w-[200px]">{ticket.subject}</span>
      </nav>
      <TicketDetailClient ticket={serialized} agents={agents} currentUserId={session.user.id} />
    </div>
  );
}
