import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileUser } from "@/lib/mobile-auth";

export async function PATCH(req: NextRequest) {
  const user = await getMobileUser(req);
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { token } = await req.json();
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token manquant." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { pushToken: token },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getMobileUser(req);
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  await prisma.user.update({
    where: { id: user.id },
    data: { pushToken: null },
  });

  return NextResponse.json({ ok: true });
}
