import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";
import { SupportFab } from "@/components/shared/support-fab";
import { LiveActivityWrapper } from "@/components/shared/live-activity-wrapper";
import { auth } from "@/lib/auth";
import { getSiteSettings } from "@/lib/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: { default: `${s.siteName} — ${s.siteTagline}`, template: `%s | ${s.siteName}` },
    description: `Achetez vos jeux numériques, cartes Steam, PS Plus, Xbox Game Pass en toute sécurité. Livraison rapide en Tunisie.`,
    keywords: ["jeux numériques", "steam", "playstation", "xbox", "cartes prépayées", "tunisie"],
    metadataBase: new URL(s.siteUrl || "https://loot.tn"),
    openGraph: {
      type: "website",
      siteName: s.siteName,
      title: `${s.siteName} — ${s.siteTagline}`,
      description: `Achetez vos jeux numériques, cartes Steam, PS Plus, Xbox Game Pass en toute sécurité. Livraison rapide en Tunisie.`,
      images: s.logoUrl ? [{ url: s.logoUrl, width: 200, height: 200 }] : [],
    },
    twitter: {
      card: "summary",
      title: `${s.siteName} — ${s.siteTagline}`,
      description: `Achetez vos jeux numériques, cartes Steam, PS Plus, Xbox Game Pass en toute sécurité.`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [session, settings] = await Promise.all([auth(), getSiteSettings()]);

  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100">
        <SessionProvider session={session}>
          <Header siteName={settings.siteName} logoUrl={settings.logoUrl} />
          <main className="flex-1">{children}</main>
          <Footer siteName={settings.siteName} logoUrl={settings.logoUrl} />
          <SupportFab />
          <LiveActivityWrapper />
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
