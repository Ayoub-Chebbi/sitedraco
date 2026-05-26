import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSiteSettings } from "@/lib/site-settings";
import { SettingsClient } from "./settings-client";

export const metadata = { title: "Paramètres — Admin" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/");

  const settings = await getSiteSettings();
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Paramètres du site</h1>
        <p className="text-gray-500 text-sm mt-1">Logo, nom, tagline et URL utilisés partout sur le site.</p>
      </div>
      <SettingsClient initial={settings} />
    </div>
  );
}
