import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateSchema = z.object({
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(5000),
  category: z.enum(["general", "order", "payment", "technical", "refund"]).default("general"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  orderId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["admin", "support"].includes(token.role as string);

  const tickets = await prisma.supportTicket.findMany({
    where: isAdmin ? undefined : { userId: token.id as string },
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
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { subject, message, category, priority, orderId } = parsed.data;

  const ticket = await prisma.supportTicket.create({
    data: {
      subject,
      category,
      priority,
      userId: token.id as string,
      orderId: orderId || null,
      messages: {
        create: {
          message,
          senderId: token.id as string,
        },
      },
    },
    include: { messages: true },
  });

  return NextResponse.json(ticket, { status: 201 });
}
