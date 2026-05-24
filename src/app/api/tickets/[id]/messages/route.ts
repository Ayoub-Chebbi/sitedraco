import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = ["admin", "support"].includes(session.user.role);
  if (!isAdmin && ticket.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Create message
  const message = await prisma.ticketMessage.create({
    data: { ticketId: id, senderId: session.user.id, message: parsed.data.message },
    include: { sender: { select: { id: true, name: true, email: true, role: true } } },
  });

  // Update ticket status as a separate operation (don't block the response on this)
  if (!isAdmin && ticket.status === "resolved") {
    await prisma.supportTicket.update({ where: { id }, data: { status: "open", resolvedAt: null } });
  } else if (isAdmin && ticket.status === "open") {
    await prisma.supportTicket.update({
      where: { id },
      data: { status: "in_progress", agentId: session.user.id },
    });
  }

  return NextResponse.json(message, { status: 201 });
}
