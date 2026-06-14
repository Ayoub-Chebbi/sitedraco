import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/checkout/order?orderId=xxx
// Used by the success page when total was 0 (loyalty covered full amount, no Flouci payment_id)
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) return NextResponse.json({ error: "orderId manquant." }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { orderNumber: true, paymentStatus: true, totalAmount: true },
  });

  if (!order) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  if (order.paymentStatus !== "paid") return NextResponse.json({ error: "Paiement non confirmé." }, { status: 402 });

  return NextResponse.json({ orderNumber: order.orderNumber, totalAmount: order.totalAmount });
}
