import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// GET /api/reviews?productId=xxx  — fetch reviews for a product page
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId requis" }, { status: 400 });

  const reviews = await prisma.review.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, rating: true, comment: true, createdAt: true, order: { select: { user: { select: { name: true } } } } },
  });

  const formatted = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    authorName: r.order.user?.name ?? "Client vérifié",
  }));

  return NextResponse.json(formatted);
}

// GET /api/reviews?token=xxx  — resolve a review token to order info
export async function HEAD(req: NextRequest) {
  return NextResponse.json({});
}

const submitSchema = z.object({
  token: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// POST /api/reviews  — submit a review
export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 400 });

  const { token, rating, comment } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { reviewToken: token },
    include: { items: { select: { productId: true }, take: 1 } },
  });

  if (!order) return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 404 });
  if (order.paymentStatus !== "paid") return NextResponse.json({ error: "Commande non payée." }, { status: 403 });

  const productId = order.items[0]?.productId;
  if (!productId) return NextResponse.json({ error: "Commande vide." }, { status: 400 });

  // Upsert so clicking the email link twice doesn't create a duplicate
  const review = await prisma.review.upsert({
    where: { orderId: order.id },
    create: { orderId: order.id, productId, rating, comment },
    update: { rating, comment },
  });

  return NextResponse.json({ success: true, reviewId: review.id });
}
