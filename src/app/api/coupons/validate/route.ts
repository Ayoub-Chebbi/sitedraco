import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  code: z.string().min(1).max(50),
  amount: z.number().positive(),
});

const INVALID_MSG = "Code promo invalide ou inapplicable.";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const { allowed, retryAfterMs } = await rateLimit(`coupon:${ip}`, { max: 20, windowMs: 60 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429, headers: { "Retry-After": Math.ceil(retryAfterMs / 1000).toString() } });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 400 });

  const { code, amount } = parsed.data;

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase().trim() } });

  if (!coupon || !coupon.isActive) {
    return NextResponse.json({ error: INVALID_MSG }, { status: 404 });
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ error: INVALID_MSG }, { status: 400 });
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ error: INVALID_MSG }, { status: 400 });
  }
  if (coupon.minAmount && amount < coupon.minAmount) {
    return NextResponse.json(
      { error: `Montant minimum requis : ${coupon.minAmount.toFixed(2)} TND.` },
      { status: 400 }
    );
  }

  const discount =
    coupon.type === "percentage"
      ? Math.min(amount, (amount * coupon.value) / 100)
      : Math.min(amount, coupon.value);

  return NextResponse.json({
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount: Math.round(discount * 100) / 100,
  });
}
