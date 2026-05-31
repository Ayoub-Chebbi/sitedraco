import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { notifySupportNewTicket } from "@/lib/push-notifications";

const CreateSchema = z.object({
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(5000),
  category: z.enum(["general", "order", "payment", "technical", "refund"]).default("general"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  orderId: z.string().optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["admin", "support"].includes(session.user.role);

  const tickets = await prisma.supportTicket.findMany({
    where: isAdmin ? undefined : { userId: session.user.id },
    include: {
      user: { select: { name: true, email: true } },
      agent: { select: { name: true, email: true } },
      order: { select: { orderNumber: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tickets);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Verify user exists in DB — stale session after account deletion would cause FK failure
  const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!userExists) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { subject, message, category, priority, orderId } = parsed.data;

  try {
    // Two separate queries — avoids nested write issues with the Neon HTTP adapter
    const ticket = await prisma.supportTicket.create({
      data: {
        subject,
        category,
        priority,
        userId,
        orderId: orderId || null,
      },
    });

    const ticketMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: userId,
        message,
      },
    });

    notifySupportNewTicket({
      ticketId: ticket.id,
      subject,
      fromEmail: session.user.email!,
      fromName: session.user.name,
    }).catch(console.error);

    return NextResponse.json({ ...ticket, messages: [ticketMessage] }, { status: 201 });
  } catch (err) {
    console.error("Ticket creation error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Une erreur est survenue. Réessayez." }, { status: 500 });
  }
}
