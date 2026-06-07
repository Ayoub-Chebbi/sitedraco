import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/reviews/token?token=xxx — resolve token to order/product info
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token manquant." }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { reviewToken: token },
    select: {
      id: true,
      orderNumber: true,
      paymentStatus: true,
      review: { select: { rating: true, comment: true } },
      items: {
        include: { product: { select: { id: true, name: true, imageUrl: true } } },
      },
    },
  });

  if (!order) return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 404 });
  if (order.paymentStatus !== "paid") return NextResponse.json({ error: "Commande non payée." }, { status: 403 });

  return NextResponse.json({
    orderNumber: order.orderNumber,
    alreadyReviewed: !!order.review,
    existingRating: order.review?.rating ?? null,
    existingComment: order.review?.comment ?? null,
    products: order.items.map((i) => ({ id: i.product.id, name: i.product.name, imageUrl: i.product.imageUrl })),
  });
}
