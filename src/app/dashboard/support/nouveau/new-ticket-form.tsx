"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/use-toast";
import { Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type Order = { id: string; orderNumber: string; status: string; totalAmount: number };

const CATEGORIES = [
  { value: "general",   label: "Question générale" },
  { value: "order",     label: "Problème de commande" },
  { value: "payment",   label: "Problème de paiement" },
  { value: "technical", label: "Problème technique" },
  { value: "refund",    label: "Demande de remboursement" },
];

export function NewTicketForm({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    subject: "",
    message: "",
    category: "general",
    priority: "normal",
    orderId: "",
  });

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, orderId: form.orderId || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Erreur", description: "Impossible de créer le ticket", variant: "error" });
        return;
      }
      toast({ title: "Ticket créé !", description: "Notre équipe vous répondra rapidement.", variant: "success" });
      router.push(`/dashboard/support/${data.id}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Catégorie *</label>
          <select required value={form.category} onChange={(e) => set("category", e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500">
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Sujet *</label>
          <input required minLength={5} value={form.subject} onChange={(e) => set("subject", e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
            placeholder="Décrivez brièvement votre problème" />
        </div>

        {orders.length > 0 && (
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Commande concernée (optionnel)</label>
            <select value={form.orderId} onChange={(e) => set("orderId", e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500">
              <option value="">Aucune commande spécifique</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  #{o.orderNumber} · {formatPrice(o.totalAmount)} · {o.status}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Message *</label>
          <textarea required minLength={10} rows={5} value={form.message} onChange={(e) => set("message", e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 resize-none"
            placeholder="Décrivez votre problème en détail…" />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Envoi…</> : "Envoyer le ticket"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
      </div>
    </form>
  );
}
