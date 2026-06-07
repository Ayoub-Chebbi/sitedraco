import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generateCode(): string {
  return "LOOT" + randomBytes(3).toString("hex").toUpperCase().slice(0, 4);
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      referralCode: true,
      referralsMade: {
        select: { status: true, rewardGiven: true, createdAt: true, referredUser: { select: { email: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // Auto-generate code on first access
  if (!user?.referralCode) {
    let code = generateCode();
    // Retry on collision (extremely unlikely)
    while (await prisma.user.findUnique({ where: { referralCode: code } })) {
      code = generateCode();
    }
    await prisma.user.update({ where: { id: session.user.id }, data: { referralCode: code } });
    user = { ...user!, referralCode: code };
  }

  const completed = user.referralsMade.filter((r) => r.status === "completed");
  const pending = user.referralsMade.filter((r) => r.status === "pending");
  const totalEarned = completed.reduce((sum, r) => sum + r.rewardGiven, 0);

  return NextResponse.json({
    code: user.referralCode,
    stats: {
      totalReferrals: user.referralsMade.length,
      completed: completed.length,
      pending: pending.length,
      totalEarned,
    },
    referrals: user.referralsMade.map((r) => ({
      status: r.status,
      rewardGiven: r.rewardGiven,
      createdAt: r.createdAt.toISOString(),
      name: r.referredUser.name ?? r.referredUser.email.split("@")[0],
    })),
  });
}
