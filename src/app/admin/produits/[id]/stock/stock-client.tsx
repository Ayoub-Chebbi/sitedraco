"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Eye, EyeOff, Loader2, Package, CheckCircle, Clock } from "lucide-react";
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
};

export function StockClient({ productId, productName, keys: initialKeys }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [keys, setKeys] = useState<Key[]>(initialKeys);
  const [newKeys, setNewKeys] = useState("");
  const [showValues, setShowValues] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const available = keys.filter((k) => k.status === "available");
  const sold = keys.filter((k) => k.status !== "available");

  function maskKey(value: string) {
    if (value.length <= 8) return "•".repeat(value.length);
    return value.slice(0, 4) + "•".repeat(Math.min(value.length - 8, 12)) + value.slice(-4);
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
      const res = await fetch(`/api/admin/products/${productId}/keys/${keyId}`, {
        method: "DELETE",
      });
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
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
          <p className="text-2xl font-bold text-white">{keys.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total</p>
        </div>
        <div className="rounded-xl border border-green-800/40 bg-green-900/10 p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{available.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Disponibles</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
          <p className="text-2xl font-bold text-gray-400">{sold.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Vendues</p>
        </div>
      </div>

      {/* Add keys */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Plus className="h-4 w-4 text-purple-400" />
          Ajouter des clés
        </h2>
        <textarea
          rows={5}
          value={newKeys}
          onChange={(e) => setNewKeys(e.target.value)}
          placeholder={"XXXXX-XXXXX-XXXXX\nYYYYY-YYYYY-YYYYY\n(une clé par ligne)"}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-purple-500 resize-none"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-600">
            {newKeys.split(/\r?\n/).filter((k) => k.trim()).length} clé(s) à ajouter
          </p>
          <Button onClick={handleAdd} disabled={isPending || !newKeys.trim()} className="gap-2">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Ajouter
          </Button>
        </div>
      </div>

      {/* Keys list */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-400" />
            Stock ({keys.length} clés)
          </h2>
          <button
            type="button"
            onClick={() => setShowValues((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            {showValues ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showValues ? "Masquer" : "Afficher"} les clés
          </button>
        </div>

        {keys.length === 0 ? (
          <div className="px-4 py-10 text-center text-gray-500 text-sm">
            Aucune clé pour ce produit
          </div>
        ) : (
          <div className="divide-y divide-gray-800/50 max-h-[500px] overflow-y-auto">
            {keys.map((key) => (
              <div key={key.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/30">
                <div className="shrink-0">
                  {key.status === "available" ? (
                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-gray-600 inline-block" />
                  )}
                </div>

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
                      {deletingId === key.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
