import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { status: { in: ["open", "in_progress"] } },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      user: { select: { name: true, email: true } },
      order: { select: { orderNumber: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: { select: { role: true } } },
      },
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json(tickets);
}
