import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserTicketClient } from "./user-ticket-client";
import { ChevronRight } from "lucide-react";

export default async function UserTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/connexion");

  const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id, userId: session.user.id },
    include: {
      order: { select: { orderNumber: true } },
      messages: {
        include: { sender: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!ticket) notFound();

  const serialized = {
    ...ticket,
    createdAt: ticket.createdAt.toISOString(),
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
    messages: ticket.messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <Link href="/dashboard" className="hover:text-gray-300">Mon compte</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/dashboard/support" className="hover:text-gray-300">Support</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-300 truncate max-w-[160px]">{ticket.subject}</span>
      </nav>
      <UserTicketClient ticket={serialized} currentUserId={session.user.id} />
    </div>
  );
}
