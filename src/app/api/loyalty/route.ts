import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const [user, transactions] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { loyaltyPoints: true } }),
    prisma.loyaltyTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, type: true, amount: true, description: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({
    balance: user?.loyaltyPoints ?? 0,
    transactions: transactions.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
  });
}
