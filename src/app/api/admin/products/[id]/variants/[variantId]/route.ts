import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  price: z.number().positive().optional(),
  discountPrice: z.number().positive().optional().nullable(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

async function requireAdmin(req: NextRequest) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { variantId } = await params;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const variant = await prisma.productVariant.update({
    where: { id: variantId },
    data: parsed.data,
  });

  return NextResponse.json(variant);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { variantId } = await params;
  await prisma.productVariant.delete({ where: { id: variantId } });
  return new NextResponse(null, { status: 204 });
}
