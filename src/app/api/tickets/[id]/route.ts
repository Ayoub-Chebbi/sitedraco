import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  agentId: z.string().optional().nullable(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const isAdmin = ["admin", "support"].includes(session.user.role);

  const ticket = await prisma.supportTicket.findUnique({
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
  });

  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isAdmin && ticket.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(ticket);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "resolved") data.resolvedAt = new Date();

  const ticket = await prisma.supportTicket.update({ where: { id }, data });
  return NextResponse.json(ticket);
}
