import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULTS = [
  { value: "ps5",      label: "PS5",      displayOrder: 0 },
  { value: "ps4",      label: "PS4",      displayOrder: 1 },
  { value: "xbox",     label: "Xbox",     displayOrder: 2 },
  { value: "pc",       label: "PC",       displayOrder: 3 },
  { value: "steam",    label: "Steam",    displayOrder: 4 },
  { value: "nintendo", label: "Nintendo", displayOrder: 5 },
  { value: "mobile",   label: "Mobile",   displayOrder: 6 },
  { value: "other",    label: "Autre",    displayOrder: 7 },
];

export async function GET() {
  let platforms = await prisma.platform.findMany({
    orderBy: [{ displayOrder: "asc" }, { label: "asc" }],
  });

  if (platforms.length === 0) {
    try {
      for (const d of DEFAULTS) {
        await prisma.platform.upsert({ where: { value: d.value }, create: d, update: {} });
      }
    } catch {
      // seeding failed — return hardcoded fallback
      return NextResponse.json(DEFAULTS.map((d, i) => ({ ...d, id: String(i), createdAt: new Date() })));
    }
    platforms = await prisma.platform.findMany({
      orderBy: [{ displayOrder: "asc" }, { label: "asc" }],
    });
  }

  return NextResponse.json(platforms);
}
