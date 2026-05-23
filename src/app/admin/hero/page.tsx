import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HeroEditorClient } from "./hero-editor-client";
import { ImageIcon } from "lucide-react";

export default async function AdminHeroPage() {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) {
    redirect("/");
  }

  const slides = await prisma.heroSlide.findMany({
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <ImageIcon className="h-6 w-6 text-purple-400" />
        <h1 className="text-2xl font-bold text-white">Carrousel Hero</h1>
      </div>
      <p className="text-sm text-gray-500 mb-8">
        Ces slides s&apos;affichent sur la page d&apos;accueil. Si aucun slide actif n&apos;existe, le carrousel par défaut est utilisé.
      </p>

      <HeroEditorClient initialSlides={slides} />
    </div>
  );
}
