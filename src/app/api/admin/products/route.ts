import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !["admin", "support"].includes(token.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

const CreateSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug invalide (lettres minuscules, chiffres et tirets uniquement)"),
  description: z.string().max(2000).optional().nullable(),
  platform: z.enum(["ps4", "ps5", "xbox", "steam", "nintendo", "mobile", "other"]),
  category: z.enum(["game", "dlc", "subscription", "credit", "giftcard"]),
  productType: z.enum(["key", "account", "both"]).optional().default("key"),
  price: z.number().positive(),
  discountPrice: z.number().positive().optional().nullable(),
  accountPrice: z.number().positive().optional().nullable(),
  accountDiscountPrice: z.number().positive().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  lowStockAlert: z.number().int().min(0).optional().default(5),
  soldCount: z.number().int().min(0).optional().default(0),
  rating: z.number().min(0).max(5).optional().default(4.8),
  reviewCount: z.number().int().min(0).optional().default(0),
  urgencyHours: z.number().int().min(0).optional().default(4),
});

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  const products = await prisma.product.findMany({
    include: {
      _count: { select: { keys: { where: { status: "available" } }, upsells: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const existing = await prisma.product.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return NextResponse.json({ error: "Ce slug est déjà utilisé." }, { status: 409 });

  const product = await prisma.product.create({ data: parsed.data });
  return NextResponse.json(product, { status: 201 });
}
