"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Save, Globe, Image as ImageIcon, Type, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/use-toast";

type Props = {
  initial: { siteName: string; logoUrl: string; siteTagline: string; siteUrl: string };
};

export function SettingsClient({ initial }: Props) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "logo");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      set("logoUrl", data.url);
      toast({ title: "Logo uploadé", variant: "success" });
    } catch (err: unknown) {
      toast({ title: "Erreur d'upload", description: err instanceof Error ? err.message : "Erreur", variant: "error" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
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
      {/* Logo */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-purple-400" /> Logo du site
        </h2>

        <div className="flex items-center gap-6 mb-5">
          <div className="w-16 h-16 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
            {form.logoUrl ? (
              <Image src={form.logoUrl} alt="Logo" width={64} height={64} className="object-contain" unoptimized />
            ) : (
              <span className="font-black text-white text-2xl">{form.siteName.charAt(0)}</span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            {/* Upload button */}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 border-gray-700"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Upload…" : "Uploader un logo"}
            </Button>
            <p className="text-xs text-gray-600">PNG, SVG ou WebP — fond transparent recommandé</p>
          </div>
          {form.logoUrl && (
            <button
              type="button"
              onClick={() => set("logoUrl", "")}
              className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors shrink-0"
              title="Supprimer le logo"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Manual URL fallback */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">Ou entrez l'URL manuellement</label>
          <input
            type="url"
            value={form.logoUrl}
            onChange={(e) => set("logoUrl", e.target.value)}
            placeholder="https://exemple.com/logo.png"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
          />
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
