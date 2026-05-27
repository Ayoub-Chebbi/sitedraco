import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendTicketReplyEmail } from "@/lib/email";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !session.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const parsed = z.object({ message: z.string().min(1).max(5000) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Message invalide" }, { status: 422 });

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      messages: {
        include: { sender: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isStaff = ["admin", "support"].includes(session.user.role);
  if (!isStaff && ticket.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Neon HTTP adapter doesn't support transactions, so create then fetch separately
  const created = await prisma.ticketMessage.create({
    data: { ticketId: id, senderId: session.user.id, message: parsed.data.message },
  });
  const message = await prisma.ticketMessage.findUnique({
    where: { id: created.id },
    include: { sender: { select: { id: true, name: true, email: true, role: true } } },
  });

  // Update ticket status
  if (!isStaff && ticket.status === "resolved") {
    await prisma.supportTicket.update({ where: { id }, data: { status: "open", resolvedAt: null } });
  } else if (isStaff && ticket.status === "open") {
    await prisma.supportTicket.update({
      where: { id },
      data: { status: "in_progress", agentId: session.user.id },
    });
  }

  // Send email notification to client when staff replies
  if (isStaff && ticket.user?.email) {
    const history = ticket.messages.map((m) => ({
      message: m.message,
      senderName: m.sender.name ?? m.sender.id,
      senderRole: m.sender.role,
      createdAt: m.createdAt.toISOString(),
    }));

    sendTicketReplyEmail({
      to: ticket.user.email,
      clientName: ticket.user.name,
      ticketId: id,
      ticketSubject: ticket.subject,
      agentName: session.user.name ?? "Support",
      newMessage: parsed.data.message,
      recentMessages: history,
    }).catch((err) => console.error("[ticket-email] failed:", err));
  }

  return NextResponse.json(message!, { status: 201 });
}
