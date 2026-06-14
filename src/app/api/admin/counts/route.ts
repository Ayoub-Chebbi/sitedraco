import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const [awaitingVerification, pendingOrders] = await Promise.all([
    prisma.order.count({ where: { paymentStatus: "awaiting_verification" } }),
    prisma.order.count({ where: { status: { in: ["pending", "processing"] }, paymentStatus: "paid" } }),
  ]);

  return NextResponse.json({ awaitingVerification, pendingOrders });
}
