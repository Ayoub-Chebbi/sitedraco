"use client";

import { useState } from "react";
import Image from "next/image";
import { Save, Globe, Image as ImageIcon, Type, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/use-toast";

type Props = {
  initial: { siteName: string; logoUrl: string; siteTagline: string; siteUrl: string };
};

export function SettingsClient({ initial }: Props) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Paramètres sauvegardés", variant: "success" });
    } catch {
      toast({ title: "Erreur lors de la sauvegarde", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Logo preview */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-purple-400" /> Logo du site
        </h2>

        <div className="flex items-center gap-6 mb-5">
          <div className="w-16 h-16 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
            {form.logoUrl ? (
              <Image src={form.logoUrl} alt="Logo" width={64} height={64} className="object-contain" />
            ) : (
              <span className="font-black text-white text-2xl">{form.siteName.charAt(0)}</span>
            )}
          </div>
          <div className="text-sm text-gray-400">
            <p>Entrez l'URL d'une image pour votre logo.</p>
            <p className="text-gray-600 text-xs mt-1">PNG ou SVG recommandé, fond transparent.</p>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-400">URL du logo</label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 focus-within:border-purple-500 transition-colors">
              <Link className="h-4 w-4 text-gray-500 shrink-0" />
              <input
                type="url"
                value={form.logoUrl}
                onChange={(e) => set("logoUrl", e.target.value)}
                placeholder="https://exemple.com/logo.png"
                className="flex-1 bg-transparent py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Site identity */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Type className="h-4 w-4 text-purple-400" /> Identité du site
        </h2>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-400">Nom du site</label>
          <input
            type="text"
            value={form.siteName}
            onChange={(e) => set("siteName", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-400">Tagline (SEO description)</label>
          <input
            type="text"
            value={form.siteTagline}
            onChange={(e) => set("siteTagline", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
            <Globe className="h-3 w-3" /> URL du site (pour SEO)
          </label>
          <input
            type="url"
            value={form.siteUrl}
            onChange={(e) => set("siteUrl", e.target.value)}
            placeholder="https://votre-site.com"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        <Save className="h-4 w-4" />
        {saving ? "Sauvegarde…" : "Sauvegarder les paramètres"}
      </Button>
    </div>
  );
}
