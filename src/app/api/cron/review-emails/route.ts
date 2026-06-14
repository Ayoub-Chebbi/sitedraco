import { NextRequest, NextResponse } from "next/server";
import { randomBytes, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendReviewRequestEmail } from "@/lib/email";

// Vercel invokes cron routes with Authorization: Bearer {CRON_SECRET}
function isAuthorized(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || !auth) return false;
  const expected = `Bearer ${secret}`;
  if (auth.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(auth), Buffer.from(expected));
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  // Find paid orders that haven't had a review email sent yet,
  // paid between 10 minutes and 2 hours ago (2h ceiling avoids retroactive emails on first deploy)
  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: "paid",
      reviewEmailSentAt: null,
      OR: [
        { paidAt: { gte: twoHoursAgo, lte: tenMinutesAgo } },
        { paidAt: null, createdAt: { gte: twoHoursAgo, lte: tenMinutesAgo } },
      ],
    },
    include: {
      items: { include: { product: { select: { id: true, name: true } } } },
      user: { select: { email: true } },
    },
  });

  let sent = 0;
  const base = process.env.SITE_URL ?? process.env.NEXTAUTH_URL ?? "https://loot.tn";

  for (const order of orders) {
    const email = order.user?.email ?? order.guestEmail;
    if (!email) continue;

    const firstProductId = order.items[0]?.product.id;
    if (!firstProductId) continue;

    const token = randomBytes(32).toString("hex");
    const reviewUrl = `${base}/review?token=${token}`;

    try {
      // Stamp first so a crash in email sending doesn't cause double-sends
      await prisma.order.update({
        where: { id: order.id },
        data: {
          reviewEmailSentAt: now,
          reviewToken: token,
        },
      });

      await sendReviewRequestEmail({
        to: email,
        orderNumber: order.orderNumber,
        productNames: order.items.map((i) => i.product.name),
        reviewUrl,
      });

      sent++;
    } catch (err) {
      console.error(`[review-cron] failed for order ${order.id}:`, err);
    }
  }

  return NextResponse.json({ processed: orders.length, sent });
}
