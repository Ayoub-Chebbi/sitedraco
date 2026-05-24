import { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/site-settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();
  const base = settings.siteUrl || "https://loot.tn";

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/dashboard", "/api", "/checkout"] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
