import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const REFERRAL_DISCOUNT_PCT = 5; // 5% off for the referred friend
const REFERRER_REWARD = 5;       // 5 TND loyalty credit for the referrer

// POST /api/referral/validate  { code, orderTotal }
export async function POST(req: NextRequest) {
  let body: { code?: string; orderTotal?: number };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { code, orderTotal = 0 } = body;
  if (!code) return NextResponse.json({ error: "Code requis." }, { status: 400 });

  const session = await auth();

  const referrer = await prisma.user.findUnique({
    where: { referralCode: code.trim().toUpperCase() },
    select: { id: true, name: true, email: true },
  });

  if (!referrer) return NextResponse.json({ error: "Code invalide." }, { status: 404 });

  // Block self-referral
  if (session && referrer.id === session.user.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas utiliser votre propre code." }, { status: 400 });
  }

  // If logged in — check they haven't had a prior paid order
  if (session) {
    const priorPaid = await prisma.order.count({
      where: { userId: session.user.id, paymentStatus: "paid" },
    });
    if (priorPaid > 0) {
      return NextResponse.json({ error: "Ce code est réservé aux nouveaux clients." }, { status: 400 });
    }

    // Already used a referral code
    const existingReferral = await prisma.referral.findUnique({
      where: { referredUserId: session.user.id },
    });
    if (existingReferral) {
      return NextResponse.json({ error: "Vous avez déjà utilisé un code de parrainage." }, { status: 400 });
    }
  }

  const discount = Math.round(orderTotal * (REFERRAL_DISCOUNT_PCT / 100) * 1000) / 1000;

  return NextResponse.json({
    valid: true,
    referrerName: referrer.name ?? referrer.email.split("@")[0],
    discountPct: REFERRAL_DISCOUNT_PCT,
    discount,
    referrerReward: REFERRER_REWARD,
  });
}
