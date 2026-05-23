import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = z.object({ message: z.string().min(1).max(5000) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Message invalide" }, { status: 422 });

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = ["admin", "support"].includes(token.role as string);
  if (!isAdmin && ticket.userId !== (token.id as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [message] = await prisma.$transaction([
    prisma.ticketMessage.create({
      data: { ticketId: id, senderId: token.id as string, message: parsed.data.message },
      include: { sender: { select: { id: true, name: true, email: true, role: true } } },
    }),
    // Reopen if resolved when user replies
    ...(!isAdmin && ticket.status === "resolved"
      ? [prisma.supportTicket.update({ where: { id }, data: { status: "open", resolvedAt: null } })]
      : []),
    // Mark in_progress if admin replies on open ticket
    ...(isAdmin && ticket.status === "open"
      ? [prisma.supportTicket.update({
          where: { id },
          data: { status: "in_progress", agentId: token.id as string },
        })]
      : []),
  ]);

  return NextResponse.json(message, { status: 201 });
}
