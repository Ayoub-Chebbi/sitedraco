import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const Schema = z.object({
  value: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/).optional(),
  label: z.string().min(1).max(100).optional(),
  emoji: z.string().max(8).optional(),
  showInHeader: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  if (parsed.data.value) {
    const conflict = await prisma.platform.findFirst({ where: { value: parsed.data.value, NOT: { id } } });
    if (conflict) return NextResponse.json({ error: "Cette valeur est déjà utilisée." }, { status: 409 });
  }

  const platform = await prisma.platform.update({ where: { id }, data: parsed.data });
  return NextResponse.json(platform);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.platform.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
