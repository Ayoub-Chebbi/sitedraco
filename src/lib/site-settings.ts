import { prisma } from "@/lib/prisma";
import { cache } from "react";

export type SiteSettings = {
  siteName: string;
  logoUrl: string;
  siteTagline: string;
  siteUrl: string;
};

const DEFAULTS: SiteSettings = {
  siteName: "Loot",
  logoUrl: "",
  siteTagline: "Jeux & Cartes Prépayées",
  siteUrl: "https://loot.tn",
};

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const rows = await prisma.siteSettings.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    siteName: map.siteName ?? DEFAULTS.siteName,
    logoUrl: map.logoUrl ?? DEFAULTS.logoUrl,
    siteTagline: map.siteTagline ?? DEFAULTS.siteTagline,
    siteUrl: map.siteUrl ?? DEFAULTS.siteUrl,
  };
});
