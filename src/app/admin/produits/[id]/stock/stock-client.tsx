"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Eye, EyeOff, Loader2, Package, CheckCircle, Clock, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/use-toast";

type Key = {
  id: string;
  keyValue: string;
  status: string;
  createdAt: string;
  deliveredAt: string | null;
  order: { orderNumber: string } | null;
};

type Props = {
  productId: string;
  productName: string;
  keys: Key[];
  manualStock: number | null;
};

export function StockClient({ productId, productName, keys: initialKeys, manualStock: initialManual }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [keys, setKeys] = useState<Key[]>(initialKeys);
  const [newKeys, setNewKeys] = useState("");
  const [showValues, setShowValues] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [manualStock, setManualStock] = useState<number>(initialManual ?? 0);
  const [isSavingStock, setIsSavingStock] = useState(false);

  const available = keys.filter((k) => k.status === "available");
  const sold = keys.filter((k) => k.status !== "available");
  const totalAvailable = available.length + manualStock;

  function maskKey(value: string) {
    if (value.length <= 8) return "•".repeat(value.length);
    return value.slice(0, 4) + "•".repeat(Math.min(value.length - 8, 12)) + value.slice(-4);
  }

  async function saveManualStock(value: number) {
    const clamped = Math.max(0, value);
    setManualStock(clamped);
    setIsSavingStock(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualStock: clamped }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Stock mis à jour", variant: "success" });
    } catch {
      toast({ title: "Erreur lors de la sauvegarde", variant: "error" });
    } finally {
      setIsSavingStock(false);
    }
  }

  async function handleAdd() {
    const lines = newKeys
      .split(/\r?\n/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
    if (lines.length === 0) {
      toast({ title: "Aucune clé", description: "Collez au moins une clé", variant: "error" });
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/admin/products/${productId}/keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys: newKeys }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Erreur", description: data.error, variant: "error" });
        return;
      }
      toast({ title: `${data.added} clé(s) ajoutée(s)`, variant: "success" });
      setNewKeys("");
      router.refresh();
    });
  }

  async function handleDelete(keyId: string) {
    setDeletingId(keyId);
    try {
      const res = await fetch(`/api/admin/products/${productId}/keys/${keyId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Erreur", description: data.error, variant: "error" });
        return;
      }
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
      toast({ title: "Clé supprimée", variant: "success" });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Total stock summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`rounded-xl border p-4 text-center ${totalAvailable === 0 ? "border-red-800/40 bg-red-900/10" : "border-green-800/40 bg-green-900/10"}`}>
          <p className={`text-2xl font-bold ${totalAvailable === 0 ? "text-red-400" : "text-green-400"}`}>{totalAvailable}</p>
          <p className="text-xs text-gray-500 mt-0.5">Disponible</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
          <p className="text-2xl font-bold text-white">{manualStock}</p>
          <p className="text-xs text-gray-500 mt-0.5">Stock manuel</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">{available.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Clés/Codes</p>
        </div>
      </div>

      {/* Manual stock counter */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="text-sm font-semibold text-white mb-1">Stock manuel</h2>
        <p className="text-xs text-gray-500 mb-4">Quantité sans clés individuelles — idéal pour comptes ou livraison manuelle</p>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setManualStock((v) => Math.max(0, v - 1))}
              className="w-9 h-9 rounded-lg border border-gray-700 bg-gray-800 flex items-center justify-center text-gray-300 hover:text-white hover:border-gray-600 transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>

            <input
              type="number"
              min="0"
              value={manualStock}
              onChange={(e) => setManualStock(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-24 text-center rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-lg font-bold text-white focus:outline-none focus:border-purple-500"
            />

            <button
              type="button"
              onClick={() => setManualStock((v) => v + 1)}
              className="w-9 h-9 rounded-lg border border-gray-700 bg-gray-800 flex items-center justify-center text-gray-300 hover:text-white hover:border-gray-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="flex gap-2">
            {[5, 10, 25, 50].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setManualStock(n)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
              >
                {n}
              </button>
            ))}
          </div>

          <Button
            onClick={() => saveManualStock(manualStock)}
            disabled={isSavingStock}
            size="sm"
            className="ml-auto gap-2"
          >
            {isSavingStock ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Add individual keys */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Plus className="h-4 w-4 text-purple-400" />
          Ajouter des clés/codes individuels
        </h2>
        <textarea
          rows={4}
          value={newKeys}
          onChange={(e) => setNewKeys(e.target.value)}
          placeholder={"XXXXX-XXXXX-XXXXX\nYYYYY-YYYYY-YYYYY\n(une clé par ligne)"}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-purple-500 resize-none"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-600">
            {newKeys.split(/\r?\n/).filter((k) => k.trim()).length} clé(s) à ajouter
          </p>
          <Button onClick={handleAdd} disabled={isPending || !newKeys.trim()} size="sm" variant="outline" className="gap-2">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Ajouter
          </Button>
        </div>
      </div>

      {/* Keys list */}
      {keys.length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-400" />
              Clés individuelles ({keys.length})
            </h2>
            <button
              type="button"
              onClick={() => setShowValues((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              {showValues ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showValues ? "Masquer" : "Afficher"}
            </button>
          </div>
          <div className="divide-y divide-gray-800/50 max-h-100 overflow-y-auto">
            {keys.map((key) => (
              <div key={key.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/30">
                <span className={`w-2 h-2 rounded-full shrink-0 ${key.status === "available" ? "bg-green-400" : "bg-gray-600"}`} />
                <code className="flex-1 text-xs font-mono text-gray-300 truncate">
                  {showValues ? key.keyValue : maskKey(key.keyValue)}
                </code>
                <div className="shrink-0 flex items-center gap-2">
                  {key.status === "available" ? (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Disponible
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {key.order ? `#${key.order.orderNumber}` : "Vendue"}
                    </span>
                  )}
                  {key.status === "available" && (
                    <button
                      type="button"
                      onClick={() => handleDelete(key.id)}
                      disabled={deletingId === key.id}
                      className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    >
                      {deletingId === key.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
