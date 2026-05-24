import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; keyId: string }> }
) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
