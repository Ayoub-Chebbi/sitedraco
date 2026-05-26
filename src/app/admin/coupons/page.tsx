import { prisma } from "@/lib/prisma";
import { CouponsClient } from "./coupons-client";

export default async function CouponsPage() {
  const raw = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  const coupons = raw.map((c) => ({
    ...c,
    type: c.type as "percentage" | "fixed",
    createdAt: c.createdAt.toISOString(),
    expiresAt: c.expiresAt?.toISOString() ?? null,
  }));

  return <CouponsClient initialCoupons={coupons} />;
}
