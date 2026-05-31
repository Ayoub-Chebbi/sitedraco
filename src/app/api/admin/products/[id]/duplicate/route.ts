import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const { id: _id, createdAt, updatedAt, slug: _slug, soldCount, ...rest } = source;

  const duplicate = await prisma.product.create({
    data: {
      ...rest,
      name: `${source.name} (Copie)`,
      slug,
      isActive: false, // draft by default
      soldCount: 0,
      variants: source.variants.length > 0 ? {
        create: source.variants.map(({ id: _vid, productId: _pid, createdAt: _c, ...v }) => v),
      } : undefined,
    },
  });

  return NextResponse.json({ id: duplicate.id }, { status: 201 });
}
