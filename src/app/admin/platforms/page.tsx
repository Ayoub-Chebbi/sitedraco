import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PlatformsClient } from "./platforms-client";

const DEFAULTS = [
  { value: "ps5",      label: "PS5",      emoji: "🎮", showInHeader: true, displayOrder: 0 },
  { value: "ps4",      label: "PS4",      emoji: "🕹️", showInHeader: true, displayOrder: 1 },
  { value: "xbox",     label: "Xbox",     emoji: "🟢", showInHeader: true, displayOrder: 2 },
  { value: "pc",       label: "PC",       emoji: "🖥️", showInHeader: true, displayOrder: 3 },
  { value: "steam",    label: "Steam",    emoji: "💻", showInHeader: true, displayOrder: 4 },
  { value: "nintendo", label: "Nintendo", emoji: "🔴", showInHeader: true, displayOrder: 5 },
  { value: "mobile",   label: "Mobile",   emoji: "📱", showInHeader: true, displayOrder: 6 },
  { value: "other",    label: "Autre",    emoji: "🎮", showInHeader: false, displayOrder: 7 },
];

export default async function AdminPlatformsPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/");

  let platforms = await prisma.platform.findMany({
    orderBy: [{ displayOrder: "asc" }, { label: "asc" }],
  });

  if (platforms.length === 0) {
    try {
      for (const d of DEFAULTS) {
        await prisma.platform.upsert({ where: { value: d.value }, create: d, update: {} });
      }
    } catch {
      // seeding failed
    }
    platforms = await prisma.platform.findMany({
      orderBy: [{ displayOrder: "asc" }, { label: "asc" }],
    });
  }

  return <PlatformsClient initialPlatforms={platforms} />;
}
