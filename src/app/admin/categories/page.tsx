import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CategoriesClient } from "./categories-client";

const DEFAULTS = [
  { slug: "game",         label: "Jeu complet",   displayOrder: 0 },
  { slug: "dlc",          label: "DLC",            displayOrder: 1 },
  { slug: "subscription", label: "Abonnement",     displayOrder: 2 },
  { slug: "credit",       label: "Crédit",         displayOrder: 3 },
  { slug: "giftcard",     label: "Carte cadeau",   displayOrder: 4 },
];

export default async function AdminCategoriesPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/");

  let categories = await prisma.category.findMany({
    orderBy: [{ displayOrder: "asc" }, { label: "asc" }],
  });

  if (categories.length === 0) {
    await prisma.category.createMany({ data: DEFAULTS, skipDuplicates: true });
    categories = await prisma.category.findMany({
      orderBy: [{ displayOrder: "asc" }, { label: "asc" }],
    });
  }

  return <CategoriesClient initialCategories={categories} />;
}
