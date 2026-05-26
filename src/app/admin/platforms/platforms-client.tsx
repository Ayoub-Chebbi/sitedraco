"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Check, X, GripVertical, Monitor, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/use-toast";

type Platform = { id: string; value: string; label: string; emoji: string; showInHeader: boolean; displayOrder: number };

const QUICK_EMOJIS = ["🎮","🕹️","🟢","🖥️","💻","🔴","📱","🎁","⭐","🏆","🔥","💎","🌟","🎯","🧩","📺"];

export function PlatformsClient({ initialPlatforms }: { initialPlatforms: Platform[] }) {
  const { toast } = useToast();
  const [platforms, setPlatforms] = useState(initialPlatforms);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ value: "", label: "", emoji: "🎮", showInHeader: true, displayOrder: "" });
  const [newForm, setNewForm] = useState({ value: "", label: "", emoji: "🎮", showInHeader: true, displayOrder: "" });
  const [showNew, setShowNew] = useState(false);
  const [isPending, startTransition] = useTransition();

  function slugify(str: string) {
    return str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function startEdit(p: Platform) {
    setEditingId(p.id);
    setEditForm({ value: p.value, label: p.label, emoji: p.emoji, showInHeader: p.showInHeader, displayOrder: String(p.displayOrder) });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch("/api/admin/platforms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: newForm.value || slugify(newForm.label),
          label: newForm.label,
          emoji: newForm.emoji,
          showInHeader: newForm.showInHeader,
          displayOrder: parseInt(newForm.displayOrder) || platforms.length,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Erreur", description: typeof data.error === "string" ? data.error : "Erreur de création", variant: "error" });
        return;
      }
      setPlatforms((prev) => [...prev, data].sort((a, b) => a.displayOrder - b.displayOrder));
      setNewForm({ value: "", label: "", emoji: "🎮", showInHeader: true, displayOrder: "" });
      setShowNew(false);
      toast({ title: "Plateforme créée", variant: "success" });
    });
  }

  function handleUpdate(id: string, e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch(`/api/admin/platforms/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: editForm.value,
          label: editForm.label,
          emoji: editForm.emoji,
          showInHeader: editForm.showInHeader,
          displayOrder: parseInt(editForm.displayOrder) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Erreur", description: typeof data.error === "string" ? data.error : "Erreur", variant: "error" });
        return;
      }
      setPlatforms((prev) => prev.map((p) => (p.id === id ? data : p)).sort((a, b) => a.displayOrder - b.displayOrder));
      setEditingId(null);
      toast({ title: "Modifiée", variant: "success" });
    });
  }

  function toggleHeader(p: Platform) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/platforms/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showInHeader: !p.showInHeader }),
      });
      const data = await res.json();
      if (res.ok) {
        setPlatforms((prev) => prev.map((pl) => (pl.id === p.id ? data : pl)));
        toast({ title: data.showInHeader ? "Affiché dans le header" : "Masqué du header", variant: "success" });
      }
    });
  }

  function handleDelete(id: string, label: string) {
    if (!confirm(`Supprimer la plateforme "${label}" ? Les produits existants garderont leur valeur.`)) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/platforms/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPlatforms((prev) => prev.filter((p) => p.id !== id));
        toast({ title: "Supprimée", variant: "success" });
      } else {
        toast({ title: "Erreur de suppression", variant: "error" });
      }
    });
  }

  function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
    return (
      <div className="space-y-2">
        <label className="block text-xs text-gray-500 mb-1">Icône (emoji)</label>
        <div className="flex items-center gap-2">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="🎮"
            className="w-16 text-center text-xl rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 focus:outline-none focus:border-purple-500"
            maxLength={4}
          />
          <div className="flex flex-wrap gap-1">
            {QUICK_EMOJIS.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => onChange(em)}
                className={`text-base w-7 h-7 rounded-md flex items-center justify-center transition-colors ${value === em ? "bg-purple-600/40 ring-1 ring-purple-500" : "hover:bg-gray-700"}`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Monitor className="h-6 w-6 text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Plateformes</h1>
            <p className="text-sm text-gray-500">{platforms.length} plateforme{platforms.length !== 1 ? "s" : ""} · {platforms.filter((p) => p.showInHeader).length} dans le header</p>
          </div>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-2" disabled={showNew}>
          <Plus className="h-4 w-4" /> Nouvelle plateforme
        </Button>
      </div>

      <div className="space-y-2">
        {showNew && (
          <form onSubmit={handleCreate} className="rounded-xl border border-purple-700/40 bg-purple-900/10 p-4 space-y-3">
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Nouvelle plateforme</p>
            <div className="space-y-2">
              <input
                required
                autoFocus
                value={newForm.label}
                onChange={(e) => setNewForm((f) => ({ ...f, label: e.target.value, value: f.value || slugify(e.target.value) }))}
                placeholder="Nom affiché (ex: PlayStation 5)"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Valeur (slug) *</label>
                  <input
                    required
                    value={newForm.value}
                    onChange={(e) => setNewForm((f) => ({ ...f, value: e.target.value }))}
                    placeholder="ps5"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white font-mono placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Ordre</label>
                  <input
                    type="number" min="0"
                    value={newForm.displayOrder}
                    onChange={(e) => setNewForm((f) => ({ ...f, displayOrder: e.target.value }))}
                    placeholder={String(platforms.length)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              <EmojiPicker value={newForm.emoji} onChange={(em) => setNewForm((f) => ({ ...f, emoji: em }))} />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newForm.showInHeader}
                  onChange={(e) => setNewForm((f) => ({ ...f, showInHeader: e.target.checked }))}
                  className="rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">Afficher dans le header</span>
              </label>
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

        {platforms.map((p) =>
          editingId === p.id ? (
            <form key={p.id} onSubmit={(e) => handleUpdate(p.id, e)} className="rounded-xl border border-purple-700/40 bg-purple-900/10 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Nom affiché</label>
                  <input
                    required autoFocus
                    value={editForm.label}
                    onChange={(e) => setEditForm((f) => ({ ...f, label: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Valeur (slug)</label>
                  <input
                    required
                    value={editForm.value}
                    onChange={(e) => setEditForm((f) => ({ ...f, value: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Ordre d&apos;affichage</label>
                  <input
                    type="number" min="0"
                    value={editForm.displayOrder}
                    onChange={(e) => setEditForm((f) => ({ ...f, displayOrder: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              <EmojiPicker value={editForm.emoji} onChange={(em) => setEditForm((f) => ({ ...f, emoji: em }))} />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.showInHeader}
                  onChange={(e) => setEditForm((f) => ({ ...f, showInHeader: e.target.checked }))}
                  className="rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">Afficher dans le header</span>
              </label>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={isPending} className="gap-1.5">
                  <Check className="h-3.5 w-3.5" /> Enregistrer
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </form>
          ) : (
            <div key={p.id} className="flex items-center gap-3 p-4 rounded-xl border border-gray-800 bg-gray-900 group hover:border-gray-700 transition-colors">
              <GripVertical className="h-4 w-4 text-gray-700 shrink-0" />
              <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 text-lg">
                {p.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{p.label}</p>
                <p className="text-xs text-gray-600 font-mono">{p.value}</p>
              </div>
              <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.showInHeader ? "bg-green-900/30 text-green-400" : "bg-gray-800 text-gray-600"}`}>
                {p.showInHeader ? "Header ✓" : "Masqué"}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleHeader(p)}
                  disabled={isPending}
                  title={p.showInHeader ? "Masquer du header" : "Afficher dans le header"}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  {p.showInHeader ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(p.id, p.label)} disabled={isPending} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )
        )}

        {platforms.length === 0 && !showNew && (
          <div className="text-center py-16 text-gray-600">
            <Monitor className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>Aucune plateforme. Créez-en une.</p>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-600 mt-6">
        La valeur est le slug stocké dans les produits (ex: <code className="font-mono">ps5</code>, <code className="font-mono">steam</code>).
        Ne la modifiez pas si des produits l&apos;utilisent déjà.
      </p>
    </div>
  );
}
