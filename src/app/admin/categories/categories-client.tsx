"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Check, X, GripVertical, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/use-toast";

type Category = { id: string; slug: string; label: string; displayOrder: number };

export function CategoriesClient({ initialCategories }: { initialCategories: Category[] }) {
  const { toast } = useToast();
  const [categories, setCategories] = useState(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ slug: "", label: "", displayOrder: "" });
  const [newForm, setNewForm] = useState({ slug: "", label: "", displayOrder: "" });
  const [showNew, setShowNew] = useState(false);
  const [isPending, startTransition] = useTransition();

  function slugify(str: string) {
    return str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditForm({ slug: cat.slug, label: cat.label, displayOrder: String(cat.displayOrder) });
  }

  function cancelEdit() { setEditingId(null); }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: newForm.slug || slugify(newForm.label),
          label: newForm.label,
          displayOrder: parseInt(newForm.displayOrder) || categories.length,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Erreur", description: typeof data.error === "string" ? data.error : "Erreur de création", variant: "error" });
        return;
      }
      setCategories((prev) => [...prev, data].sort((a, b) => a.displayOrder - b.displayOrder));
      setNewForm({ slug: "", label: "", displayOrder: "" });
      setShowNew(false);
      toast({ title: "Catégorie créée", variant: "success" });
    });
  }

  function handleUpdate(id: string, e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: editForm.slug,
          label: editForm.label,
          displayOrder: parseInt(editForm.displayOrder) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Erreur", description: typeof data.error === "string" ? data.error : "Erreur", variant: "error" });
        return;
      }
      setCategories((prev) => prev.map((c) => (c.id === id ? data : c)).sort((a, b) => a.displayOrder - b.displayOrder));
      setEditingId(null);
      toast({ title: "Modifiée", variant: "success" });
    });
  }

  function handleDelete(id: string, label: string) {
    if (!confirm(`Supprimer la catégorie "${label}" ? Les produits existants garderont leur valeur.`)) return;
    startTransition(async () => {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        toast({ title: "Supprimée", variant: "success" });
      } else {
        toast({ title: "Erreur de suppression", variant: "error" });
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Tag className="h-6 w-6 text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Catégories</h1>
            <p className="text-sm text-gray-500">{categories.length} catégorie{categories.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-2" disabled={showNew}>
          <Plus className="h-4 w-4" /> Nouvelle catégorie
        </Button>
      </div>

      <div className="space-y-2">
        {/* New category form */}
        {showNew && (
          <form onSubmit={handleCreate} className="rounded-xl border border-purple-700/40 bg-purple-900/10 p-4">
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">Nouvelle catégorie</p>
            <div className="grid grid-cols-[1fr_auto] gap-3 mb-3">
              <div className="space-y-2">
                <input
                  required
                  autoFocus
                  value={newForm.label}
                  onChange={(e) => setNewForm((f) => ({ ...f, label: e.target.value, slug: f.slug || slugify(e.target.value) }))}
                  placeholder="Nom affiché (ex: Jeu complet)"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Slug *</label>
                    <input
                      required
                      value={newForm.slug}
                      onChange={(e) => setNewForm((f) => ({ ...f, slug: e.target.value }))}
                      placeholder="jeu-complet"
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white font-mono placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Ordre</label>
                    <input
                      type="number"
                      min="0"
                      value={newForm.displayOrder}
                      onChange={(e) => setNewForm((f) => ({ ...f, displayOrder: e.target.value }))}
                      placeholder={String(categories.length)}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isPending} className="gap-1.5">
                <Check className="h-3.5 w-3.5" /> Créer
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowNew(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </form>
        )}

        {/* Existing categories */}
        {categories.map((cat) =>
          editingId === cat.id ? (
            <form key={cat.id} onSubmit={(e) => handleUpdate(cat.id, e)} className="rounded-xl border border-purple-700/40 bg-purple-900/10 p-4">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Nom affiché</label>
                  <input
                    required
                    autoFocus
                    value={editForm.label}
                    onChange={(e) => setEditForm((f) => ({ ...f, label: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Slug</label>
                  <input
                    required
                    value={editForm.slug}
                    onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Ordre d&apos;affichage</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.displayOrder}
                    onChange={(e) => setEditForm((f) => ({ ...f, displayOrder: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={isPending} className="gap-1.5">
                  <Check className="h-3.5 w-3.5" /> Enregistrer
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={cancelEdit}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </form>
          ) : (
            <div key={cat.id} className="flex items-center gap-3 p-4 rounded-xl border border-gray-800 bg-gray-900 group hover:border-gray-700 transition-colors">
              <GripVertical className="h-4 w-4 text-gray-700 shrink-0" />
              <div className="w-6 h-6 rounded-md bg-gray-800 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-gray-500">{cat.displayOrder}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{cat.label}</p>
                <p className="text-xs text-gray-600 font-mono">{cat.slug}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(cat)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(cat.id, cat.label)}
                  disabled={isPending}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )
        )}

        {categories.length === 0 && !showNew && (
          <div className="text-center py-16 text-gray-600">
            <Tag className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>Aucune catégorie. Créez-en une.</p>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-600 mt-6">
        Le slug est la valeur stockée dans les produits (ex: <code className="font-mono">game</code>, <code className="font-mono">dlc</code>).
        Ne le modifiez pas si des produits l&apos;utilisent déjà.
      </p>
    </div>
  );
}
