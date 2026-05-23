import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";
import { SupportFab } from "@/components/shared/support-fab";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Loot — Jeux & Cartes Prépayées",
  description: "Achetez vos jeux numériques, cartes Steam, PS Plus, Xbox Game Pass en toute sécurité. Livraison rapide en Tunisie.",
  keywords: ["jeux numériques", "steam", "playstation", "xbox", "cartes prépayées", "tunisie"],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100">
        <SessionProvider session={session}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <SupportFab />
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
