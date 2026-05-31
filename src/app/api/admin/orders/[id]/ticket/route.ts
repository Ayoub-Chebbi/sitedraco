import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  subject: z.string().min(5).max(200),
  message: z.string().min(5).max(5000),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, orderNumber: true, paymentStatus: true },
  });

  if (!order) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  if (!order.userId) return NextResponse.json({ error: "Cette commande n'a pas de client associé." }, { status: 400 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 422 });

  const { subject, message } = parsed.data;

  const ticket = await prisma.supportTicket.create({
    data: {
      subject,
      category: "order",
      priority: "normal",
      userId: order.userId,
      agentId: session.user.id,
      orderId: order.id,
    },
  });

  // First message is from the support agent
  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      senderId: session.user.id,
      message,
    },
  });

  return NextResponse.json({ ticketId: ticket.id }, { status: 201 });
}
