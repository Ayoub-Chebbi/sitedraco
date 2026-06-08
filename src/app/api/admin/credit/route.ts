import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  userId: z.string().min(1),
  amount: z.number().positive().max(10000),
  description: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 422 });

  const { userId, amount, description } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, loyaltyPoints: true } });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

  await prisma.user.update({
    where: { id: userId },
    data: { loyaltyPoints: { increment: amount } },
  });

  await prisma.loyaltyTransaction.create({
    data: {
      userId,
      type: "earned",
      amount,
      description: `Crédit admin : ${description}`,
    },
  });

  return NextResponse.json({ ok: true, newBalance: user.loyaltyPoints + amount });
}
