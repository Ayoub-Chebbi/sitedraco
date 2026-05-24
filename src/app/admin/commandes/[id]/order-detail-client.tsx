"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle, XCircle, Clock, Send, Loader2, Key, User, FileText, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { formatPrice, formatDate } from "@/lib/utils";
import { useToast } from "@/lib/use-toast";

type OrderData = {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string | null;
  paymentStatus: string;
  totalAmount: number;
  notesInternal: string | null;
  createdAt: string;
  customer: { email: string; name: string | null; since: string | null };
  agent: { email: string; name: string | null } | null;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    hasKey: boolean;
    productType: string;
    product: { id: string; name: string; platform: string; imageUrl: string | null };
  }[];
  auditLogs: {
    id: string;
    action: string;
    actorEmail: string;
    createdAt: string;
    metadata: string | null;
  }[];
};

const ACTION_LABELS: Record<string, string> = {
  order_created: "Commande créée",
  key_delivered: "Livraison envoyée",
  mark_failed: "Marquée échouée",
  mark_processing: "Marquée en traitement",
  mark_refunded: "Remboursée",
};

type ItemDelivery = { keyValue: string; email: string; password: string };

export function OrderDetailClient({ order }: { order: OrderData }) {
  const router = useRouter();
  const { toast } = useToast();
  const [notes, setNotes] = useState(order.notesInternal || "");
  const [loading, setLoading] = useState<string | null>(null);

  const pendingItems = order.items.filter((i) => !i.hasKey);

  const [deliveries, setDeliveries] = useState<Record<string, ItemDelivery>>(() => {
    const init: Record<string, ItemDelivery> = {};
    for (const item of order.items) {
      if (!item.hasKey) init[item.id] = { keyValue: "", email: "", password: "" };
    }
    return init;
  });

  function setField(itemId: string, field: keyof ItemDelivery, value: string) {
    setDeliveries((prev) => ({ ...prev, [itemId]: { ...prev[itemId], [field]: value } }));
  }

  function isDeliveryReady() {
    return pendingItems.every((item) => {
      const d = deliveries[item.id];
      if (!d) return false;
      if (item.productType === "account") return d.email.trim() !== "" && d.password.trim() !== "";
      return d.keyValue.trim() !== "";
    });
  }

  async function callAPI(payload: object, loadingKey: string) {
    setLoading(loadingKey);
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(null);
    if (res.ok) {
      toast({ title: "Action effectuée", variant: "success" });
      router.refresh();
    } else {
      const data = await res.json();
      toast({ title: "Erreur", description: data.error, variant: "error" });
    }
  }

  async function deliverAll() {
    const items = pendingItems.map((item) => {
      const d = deliveries[item.id];
      return {
        itemId: item.id,
        productId: item.product.id,
        type: item.productType === "account" ? "account" : "key",
        keyValue: item.productType !== "account" ? d.keyValue.trim() : undefined,
        email: item.productType === "account" ? d.email.trim() : undefined,
        password: item.productType === "account" ? d.password.trim() : undefined,
      };
    });
    await callAPI({ action: "deliver", items }, "deliver");
  }

  const canDeliver = (order.status === "processing" || order.status === "pending") && pendingItems.length > 0;
  const canFail = order.status !== "failed" && order.status !== "delivered" && order.status !== "refunded";
  const canProcess = order.status === "pending";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/commandes">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <span className="text-gray-700">/</span>
        <h1 className="font-mono text-lg font-bold text-white">{order.orderNumber}</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order info */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-400" />
              Détails de la commande
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm mb-5">
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Date</p>
                <p className="text-gray-200">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Paiement</p>
                <p className="text-gray-200 capitalize">{order.paymentMethod || "—"}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Statut paiement</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  order.paymentStatus === "paid" ? "bg-green-600/20 text-green-400" : "bg-yellow-600/20 text-yellow-400"
                }`}>
                  {order.paymentStatus === "paid" ? "Confirmé" : "En attente"}
                </span>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Total</p>
                <p className="text-white font-bold">{formatPrice(order.totalAmount)}</p>
              </div>
              {order.agent && (
                <div className="col-span-2">
                  <p className="text-gray-500 text-xs mb-0.5">Agent traitant</p>
                  <p className="text-gray-200">{order.agent.name || order.agent.email}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                  <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-xl shrink-0">🎮</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <PlatformBadge platform={item.product.platform} />
                      <span className="text-xs text-gray-500 bg-gray-700/50 px-1.5 py-0.5 rounded">
                        {item.productType === "account" ? "👤 Compte" : "🔑 Clé"}
                      </span>
                      {item.hasKey && (
                        <span className="text-xs text-green-400 flex items-center gap-0.5">
                          <CheckCircle className="h-3 w-3" /> Livré
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white mt-0.5">{item.product.name}</p>
                    <p className="text-xs text-gray-500">Qté: {item.quantity} · {formatPrice(item.unitPrice)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery section — per item */}
          {canDeliver && (
            <div className="rounded-xl border border-purple-800/50 bg-purple-900/10 p-5 space-y-5">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Send className="h-4 w-4 text-purple-400" />
                Livraison
                <span className="text-xs text-gray-500 font-normal">
                  ({pendingItems.length} article{pendingItems.length > 1 ? "s" : ""} à livrer)
                </span>
              </h2>

              {pendingItems.map((item) => (
                <div key={item.id} className="space-y-3 pb-5 border-b border-gray-800 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-300">{item.product.name}</span>
                    <span className="text-xs text-gray-600">
                      {item.productType === "account" ? "— Compte" : "— Clé d'activation"}
                    </span>
                  </div>

                  {item.productType === "account" ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1">
                          <User className="h-3 w-3" /> Email du compte
                        </label>
                        <Input
                          type="email"
                          placeholder="compte@exemple.com"
                          value={deliveries[item.id]?.email ?? ""}
                          onChange={(e) => setField(item.id, "email", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Mot de passe
                        </label>
                        <Input
                          placeholder="Mot de passe"
                          value={deliveries[item.id]?.password ?? ""}
                          onChange={(e) => setField(item.id, "password", e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1">
                        <Key className="h-3 w-3" /> Clé d&apos;activation
                      </label>
                      <Input
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        value={deliveries[item.id]?.keyValue ?? ""}
                        onChange={(e) => setField(item.id, "keyValue", e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  )}
                </div>
              ))}

              <Button
                onClick={deliverAll}
                disabled={loading === "deliver" || !isDeliveryReady()}
                className="w-full gap-2"
                size="lg"
              >
                {loading === "deliver" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <><Send className="h-4 w-4" /> Envoyer au client</>
                )}
              </Button>
              <p className="text-xs text-gray-600 text-center">
                Un seul email récapitulatif sera envoyé avec tous les accès.
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h2 className="font-semibold text-white mb-3">Note interne</h2>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ajouter une note pour l'équipe..."
              rows={3}
            />
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-purple-400" />
              Client
            </h2>
            <p className="text-sm text-gray-300">{order.customer.email}</p>
            {order.customer.name && <p className="text-xs text-gray-500 mt-0.5">{order.customer.name}</p>}
            {order.customer.since && <p className="text-xs text-gray-600 mt-0.5">Client depuis {order.customer.since}</p>}
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-3">
            <h2 className="font-semibold text-white">Actions</h2>
            {canProcess && (
              <Button
                variant="secondary"
                className="w-full gap-2"
                disabled={!!loading}
                onClick={() => callAPI({ action: "mark_processing" }, "processing")}
              >
                {loading === "processing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                Marquer en traitement
              </Button>
            )}
            {canFail && (
              <Button
                variant="destructive"
                className="w-full gap-2"
                disabled={!!loading}
                onClick={() => callAPI({ action: "mark_failed", notes }, "failed")}
              >
                {loading === "failed" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Marquer comme échouée
              </Button>
            )}
            {order.status === "failed" && (
              <Button
                variant="outline"
                className="w-full gap-2"
                disabled={!!loading}
                onClick={() => callAPI({ action: "mark_refunded" }, "refund")}
              >
                {loading === "refund" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Marquer remboursée
              </Button>
            )}
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h2 className="font-semibold text-white mb-3">Historique</h2>
            <div className="space-y-3">
              {order.auditLogs.map((log) => (
                <div key={log.id} className="flex gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-gray-300 font-medium">{ACTION_LABELS[log.action] || log.action}</p>
                    <p className="text-gray-600">{log.actorEmail} · {formatDate(log.createdAt)}</p>
                  </div>
                </div>
              ))}
              {order.auditLogs.length === 0 && (
                <p className="text-xs text-gray-600">Aucune action enregistrée</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
