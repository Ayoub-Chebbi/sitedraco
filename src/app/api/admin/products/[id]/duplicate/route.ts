import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const source = await prisma.product.findUnique({
      where: { id },
      include: { variants: { orderBy: { displayOrder: "asc" } } },
    });

    if (!source) return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });

    // Generate unique slug
    const baseSlug = `${source.slug}-copie`;
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const duplicate = await prisma.product.create({
      data: {
        name: `${source.name} (Copie)`,
        slug,
        description: source.description,
        accountDescription: source.accountDescription,
        platform: source.platform,
        category: source.category,
        brand: source.brand,
        productType: source.productType,
        requiresSteamUsername: source.requiresSteamUsername,
        price: source.price,
        discountPrice: source.discountPrice,
        accountPrice: source.accountPrice,
        accountDiscountPrice: source.accountDiscountPrice,
        imageUrl: source.imageUrl,
        isActive: false,
        manualStock: source.manualStock,
        lowStockAlert: source.lowStockAlert,
        soldCount: 0,
        rating: source.rating,
        reviewCount: source.reviewCount,
        urgencyHours: source.urgencyHours,
        variants: source.variants.length > 0 ? {
          create: source.variants.map((v) => ({
            name: v.name,
            price: v.price,
            discountPrice: v.discountPrice,
            displayOrder: v.displayOrder,
            isActive: v.isActive,
          })),
        } : undefined,
      },
    });

    return NextResponse.json({ id: duplicate.id }, { status: 201 });
  } catch (err) {
    console.error("[duplicate]", err);
    return NextResponse.json({ error: "Erreur lors de la duplication." }, { status: 500 });
  }
}
