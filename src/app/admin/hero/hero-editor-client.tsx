"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { Plus, Trash2, Edit2, Upload, Check, X, Loader2, Eye, EyeOff, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/use-toast";
import { formatPrice } from "@/lib/utils";

const GRADIENTS = [
  { label: "Violet", value: "from-purple-950/90 via-purple-950/60 to-transparent", accent: "text-purple-400" },
  { label: "Bleu", value: "from-blue-950/90 via-blue-950/60 to-transparent", accent: "text-blue-400" },
  { label: "Indigo", value: "from-indigo-950/90 via-indigo-950/60 to-transparent", accent: "text-indigo-400" },
  { label: "Fuchsia", value: "from-fuchsia-950/90 via-fuchsia-950/60 to-transparent", accent: "text-fuchsia-400" },
  { label: "Rouge", value: "from-red-950/90 via-red-950/60 to-transparent", accent: "text-red-400" },
  { label: "Vert", value: "from-green-950/90 via-green-950/60 to-transparent", accent: "text-green-400" },
];

type Slide = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  price: number;
  discountPrice: number | null;
  href: string;
  imageUrl: string;
  gradient: string;
  accentColor: string;
  displayOrder: number;
  isActive: boolean;
};

type SlideForm = {
  title: string;
  subtitle: string;
  badge: string;
  price: string;
  discountPrice: string;
  href: string;
  imageUrl: string;
  gradient: string;
  accentColor: string;
  displayOrder: string;
  isActive: boolean;
};

const EMPTY_FORM: SlideForm = {
  title: "",
  subtitle: "",
  badge: "",
  price: "",
  discountPrice: "",
  href: "/produits",
  imageUrl: "",
  gradient: GRADIENTS[0].value,
  accentColor: GRADIENTS[0].accent,
  displayOrder: "0",
  isActive: true,
};

function slideToForm(s: Slide): SlideForm {
  return {
    title: s.title,
    subtitle: s.subtitle,
    badge: s.badge,
    price: s.price.toString(),
    discountPrice: s.discountPrice?.toString() ?? "",
    href: s.href,
    imageUrl: s.imageUrl,
    gradient: s.gradient,
    accentColor: s.accentColor,
    displayOrder: s.displayOrder.toString(),
    isActive: s.isActive,
  };
}

function SlideFormPanel({
  value,
  onChange,
  onUpload,
  isUploading,
}: {
  value: SlideForm;
  onChange: (f: SlideForm) => void;
  onUpload: (f: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof SlideForm, v: string | boolean) => onChange({ ...value, [k]: v });

  return (
    <div className="space-y-3">
      {/* Image — primary field */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Image</label>
        {value.imageUrl && (
          <div className="relative w-full h-28 rounded-lg overflow-hidden border border-gray-700 bg-gray-800 mb-2">
            <Image src={value.imageUrl} alt="aperçu" fill className="object-cover"
              unoptimized={value.imageUrl.startsWith("/uploads")} />
            <button type="button" onClick={() => set("imageUrl", "")}
              className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1.5"
            onClick={() => fileRef.current?.click()} disabled={isUploading}>
            {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {isUploading ? "Upload…" : "Fichier"}
          </Button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
          <input value={value.imageUrl} onChange={(e) => set("imageUrl", e.target.value)}
            className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
            placeholder="https://… ou /uploads/…" />
        </div>
      </div>

      {/* Optional text fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Titre <span className="text-gray-600">(optionnel)</span></label>
          <input value={value.title} onChange={(e) => set("title", e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            placeholder="God of War Ragnarök" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Sous-titre <span className="text-gray-600">(optionnel)</span></label>
          <textarea rows={2} value={value.subtitle} onChange={(e) => set("subtitle", e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
            placeholder="Description courte du produit…" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Badge <span className="text-gray-600">(optionnel)</span></label>
          <input value={value.badge} onChange={(e) => set("badge", e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            placeholder="PS5 • Exclusivité" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Lien (href) <span className="text-gray-600">(optionnel)</span></label>
          <input value={value.href} onChange={(e) => set("href", e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            placeholder="/produits/mon-produit" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Prix (TND) <span className="text-gray-600">(optionnel)</span></label>
          <input type="number" min="0" step="0.001" value={value.price} onChange={(e) => set("price", e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Prix promo (TND) <span className="text-gray-600">(optionnel)</span></label>
          <input type="number" min="0" step="0.001" value={value.discountPrice} onChange={(e) => set("discountPrice", e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
        </div>
      </div>

      {/* Gradient picker */}
      <div>
        <label className="block text-xs text-gray-500 mb-1.5">Couleur du dégradé</label>
        <div className="flex flex-wrap gap-2">
          {GRADIENTS.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => onChange({ ...value, gradient: g.value, accentColor: g.accent })}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${value.gradient === g.value ? "border-purple-500 bg-purple-900/40 text-white" : "border-gray-700 text-gray-400 hover:border-gray-500"}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 items-center">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Ordre d&apos;affichage</label>
          <input type="number" min="0" value={value.displayOrder} onChange={(e) => set("displayOrder", e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={value.isActive} onChange={(e) => set("isActive", e.target.checked)}
              className="rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500" />
            <span className="text-sm text-gray-300">Actif</span>
          </label>
        </div>
      </div>
    </div>
  );
}

export function HeroEditorClient({ initialSlides }: { initialSlides: Slide[] }) {
  const { toast } = useToast();
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SlideForm>(EMPTY_FORM);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<SlideForm>(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>, onDone: (url: string) => void) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "hero");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onDone(data.url);
      toast({ title: "Image uploadée", variant: "success" });
    } catch (err) {
      toast({ title: "Erreur upload", description: (err as Error).message, variant: "error" });
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  }

  function startEdit(slide: Slide) {
    setEditingId(slide.id);
    setEditForm(slideToForm(slide));
    setShowAdd(false);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    startTransition(async () => {
      const payload = {
        title: editForm.title,
        subtitle: editForm.subtitle,
        badge: editForm.badge,
        price: parseFloat(editForm.price) || 0,
        discountPrice: editForm.discountPrice ? parseFloat(editForm.discountPrice) : null,
        href: editForm.href || "/produits",
        imageUrl: editForm.imageUrl,
        gradient: editForm.gradient,
        accentColor: editForm.accentColor,
        displayOrder: parseInt(editForm.displayOrder) || 0,
        isActive: editForm.isActive,
      };
      const res = await fetch(`/api/admin/hero-slides/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { toast({ title: "Erreur", variant: "error" }); return; }
      const updated = await res.json();
      setSlides((prev) => prev.map((s) => (s.id === editingId ? updated : s)).sort((a, b) => a.displayOrder - b.displayOrder));
      setEditingId(null);
      toast({ title: "Slide mis à jour", variant: "success" });
    });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        title: addForm.title,
        subtitle: addForm.subtitle,
        badge: addForm.badge,
        price: parseFloat(addForm.price) || 0,
        discountPrice: addForm.discountPrice ? parseFloat(addForm.discountPrice) : null,
        href: addForm.href || "/produits",
        imageUrl: addForm.imageUrl,
        gradient: addForm.gradient,
        accentColor: addForm.accentColor,
        displayOrder: parseInt(addForm.displayOrder) || slides.length,
        isActive: addForm.isActive,
      };
      const res = await fetch("/api/admin/hero-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { toast({ title: "Erreur", variant: "error" }); return; }
      const created = await res.json();
      setSlides((prev) => [...prev, created].sort((a, b) => a.displayOrder - b.displayOrder));
      setAddForm({ ...EMPTY_FORM, displayOrder: String(slides.length + 1) });
      setShowAdd(false);
      toast({ title: "Slide créé", description: created.title, variant: "success" });
    });
  }

  function handleDelete(id: string, title: string) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/hero-slides/${id}`, { method: "DELETE" });
      if (!res.ok) { toast({ title: "Erreur", variant: "error" }); return; }
      setSlides((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Slide supprimé", description: title || "Sans titre", variant: "success" });
    });
  }

  async function toggleActive(slide: Slide) {
    const res = await fetch(`/api/admin/hero-slides/${slide.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !slide.isActive }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSlides((prev) => prev.map((s) => (s.id === slide.id ? updated : s)));
    }
  }

  return (
    <div className="space-y-3">
      {/* Slides list */}
      {slides.map((slide) => (
        <div key={slide.id} className={`rounded-xl border transition-colors ${slide.isActive ? "border-gray-800 bg-gray-900" : "border-gray-800/50 bg-gray-950 opacity-60"}`}>
          {editingId === slide.id ? (
            <form onSubmit={handleSave} className="p-4 space-y-4">
              <SlideFormPanel
                value={editForm}
                onChange={setEditForm}
                onUpload={(e) => uploadFile(e, (url) => setEditForm((f) => ({ ...f, imageUrl: url })))}
                isUploading={isUploading}
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={isPending} className="gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  Enregistrer
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={cancelEdit}>
                  <X className="h-3.5 w-3.5" />
                  Annuler
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex items-center gap-3 p-3">
              <GripVertical className="h-4 w-4 text-gray-700 shrink-0" />
              <div className="relative w-16 h-10 rounded-md overflow-hidden bg-gray-800 shrink-0">
                {slide.imageUrl
                  ? <Image src={slide.imageUrl} alt={slide.title || "slide"} fill className="object-cover" unoptimized={slide.imageUrl.startsWith("/uploads")} />
                  : <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">—</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{slide.title || <span className="text-gray-600 italic">Sans titre</span>}</p>
                <p className="text-xs text-gray-500 truncate">{slide.badge || "—"}{slide.price > 0 ? ` · ${formatPrice(slide.discountPrice ?? slide.price)}` : ""}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleActive(slide)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
                  title={slide.isActive ? "Désactiver" : "Activer"}>
                  {slide.isActive ? <Eye className="h-4 w-4 text-green-400" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => startEdit(slide)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-purple-400 hover:bg-purple-900/20 transition-colors">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(slide.id, slide.title)} disabled={isPending}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-40">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {slides.length === 0 && !showAdd && (
        <div className="rounded-xl border border-dashed border-gray-700 py-12 text-center text-gray-500">
          <p className="text-sm">Aucun slide. Le carrousel utilisera les slides par défaut.</p>
        </div>
      )}

      {/* Add new slide */}
      {showAdd ? (
        <form onSubmit={handleAdd} className="rounded-xl border border-purple-700/40 bg-purple-950/10 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-white">Nouveau slide</h3>
          <SlideFormPanel
            value={addForm}
            onChange={setAddForm}
            onUpload={(e) => uploadFile(e, (url) => setAddForm((f) => ({ ...f, imageUrl: url })))}
            isUploading={isUploading}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Ajouter
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowAdd(false)}>
              Annuler
            </Button>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 border-dashed"
          onClick={() => { setShowAdd(true); setEditingId(null); setAddForm({ ...EMPTY_FORM, displayOrder: String(slides.length) }); }}
        >
          <Plus className="h-4 w-4" />
          Ajouter un slide
        </Button>
      )}
    </div>
  );
}
