import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !["admin", "support"].includes(token.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; keyId: string }> }
) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  const { id, keyId } = await params;

  const key = await prisma.productKey.findFirst({
    where: { id: keyId, productId: id },
  });

  if (!key) return NextResponse.json({ error: "Clé introuvable" }, { status: 404 });
  if (key.status !== "available") {
    return NextResponse.json({ error: "Impossible de supprimer une clé déjà vendue" }, { status: 400 });
  }

  await prisma.productKey.delete({ where: { id: keyId } });
  return NextResponse.json({ ok: true });
}
