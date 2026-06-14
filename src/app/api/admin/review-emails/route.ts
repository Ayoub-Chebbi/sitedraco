import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendReviewRequestEmail } from "@/lib/email";

async function checkAdmin() {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) return null;
  return session;
}

// Send review email for a single order (or all pending in the last 7 days)
export async function POST(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const body = await req.json().catch(() => ({})) as { orderId?: string };
  const { orderId } = body;

  const base = process.env.SITE_URL ?? "https://loot.tn";
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const orders = await prisma.order.findMany({
    where: orderId
      ? { id: orderId, paymentStatus: "paid" }
      : {
          paymentStatus: "paid",
          reviewEmailSentAt: null,
          OR: [
            { paidAt: { gte: sevenDaysAgo } },
            { paidAt: null, createdAt: { gte: sevenDaysAgo } },
          ],
        },
    include: {
      items: { include: { product: { select: { id: true, name: true } } } },
      user: { select: { email: true } },
    },
  });

  let sent = 0;
  const errors: string[] = [];

  for (const order of orders) {
    const email = order.user?.email ?? order.guestEmail;
    if (!email) continue;
    if (!order.items[0]) continue;

    const token = randomBytes(32).toString("hex");
    const reviewUrl = `${base}/review?token=${token}`;

    try {
      await prisma.order.update({
        where: { id: order.id },
        data: { reviewEmailSentAt: now, reviewToken: token },
      });

      await sendReviewRequestEmail({
        to: email,
        orderNumber: order.orderNumber,
        productNames: order.items.map((i) => i.product.name),
        reviewUrl,
      });

      sent++;
    } catch (err) {
      console.error(`[admin/review-emails] failed for order ${order.id}:`, err);
      errors.push(`#${order.orderNumber}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ processed: orders.length, sent, errors });
}
