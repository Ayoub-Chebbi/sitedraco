"use client";

import { useState } from "react";
import { Copy, CheckCheck, Eye, EyeOff, Key, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { formatDate } from "@/lib/utils";

type KeyEntry = {
  id: string;
  productName: string;
  platform: string;
  orderNumber: string;
  deliveredAt: string;
  type: "key" | "account";
  keyValue: string;
  accountEmail: string;
  accountPassword: string;
};

export function KeysClient({ keys }: { keys: KeyEntry[] }) {
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function toggleVisible(id: string) {
    setVisibleIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function copyText(id: string, value: string) {
    navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (keys.length === 0) {
    return (
      <div className="text-center py-16 rounded-xl border border-gray-800 bg-gray-900">
        <Key className="h-12 w-12 text-gray-700 mx-auto mb-4" />
        <p className="text-gray-400 font-semibold">Aucune clé reçue</p>
        <p className="text-sm text-gray-600 mt-2">Vos clés et accès apparaîtront ici après livraison.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {keys.map((entry) => {
        const isVisible = visibleIds.has(entry.id);
        return (
          <div key={entry.id} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <PlatformBadge platform={entry.platform} />
                  <span className="text-xs text-gray-600 font-mono">{entry.orderNumber}</span>
                  <span className="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">
                    {entry.type === "account" ? "👤 Compte" : "🔑 Clé"}
                  </span>
                </div>
                <p className="font-semibold text-white">{entry.productName}</p>
                <p className="text-xs text-gray-600 mt-0.5">Livré le {formatDate(entry.deliveredAt)}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toggleVisible(entry.id)}
                title={isVisible ? "Masquer" : "Afficher"}
              >
                {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            {entry.type === "account" ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 w-20 shrink-0">
                    <User className="h-3 w-3" /> Email
                  </div>
                  <div className="flex-1 font-mono text-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 select-all">
                    {isVisible ? entry.accountEmail : "••••••••••••••••"}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyText(`${entry.id}-email`, entry.accountEmail)}
                    className="gap-1 shrink-0"
                  >
                    {copiedId === `${entry.id}-email` ? (
                      <><CheckCheck className="h-3 w-3 text-green-400" /> Copié</>
                    ) : (
                      <><Copy className="h-3 w-3" /> Copier</>
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 w-20 shrink-0">
                    <Key className="h-3 w-3" /> Mdp
                  </div>
                  <div className="flex-1 font-mono text-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 select-all">
                    {isVisible ? entry.accountPassword : "••••••••••"}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyText(`${entry.id}-pwd`, entry.accountPassword)}
                    className="gap-1 shrink-0"
                  >
                    {copiedId === `${entry.id}-pwd` ? (
                      <><CheckCheck className="h-3 w-3 text-green-400" /> Copié</>
                    ) : (
                      <><Copy className="h-3 w-3" /> Copier</>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex-1 min-w-0 font-mono text-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 select-all overflow-x-auto">
                  {isVisible ? entry.keyValue : "••••-••••-••••-••••"}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyText(entry.id, entry.keyValue)}
                  className="gap-1 shrink-0"
                >
                  {copiedId === entry.id ? (
                    <><CheckCheck className="h-3 w-3 text-green-400" /> Copié</>
                  ) : (
                    <><Copy className="h-3 w-3" /> Copier</>
                  )}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
