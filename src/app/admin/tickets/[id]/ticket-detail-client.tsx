"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { formatDate, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/use-toast";
import { Send, CheckCircle, Clock, Loader2, User, Shield } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "open",        label: "Ouvert",    color: "text-yellow-400" },
  { value: "in_progress", label: "En cours",  color: "text-blue-400" },
  { value: "resolved",    label: "Résolu",    color: "text-green-400" },
  { value: "closed",      label: "Fermé",     color: "text-gray-500" },
];

const PRIORITY_OPTIONS = [
  { value: "low",    label: "Faible",  color: "text-gray-500" },
  { value: "normal", label: "Normal",  color: "text-blue-400" },
  { value: "high",   label: "Élevé",   color: "text-orange-400" },
  { value: "urgent", label: "Urgent",  color: "text-red-400" },
];

const CATEGORY_LABEL: Record<string, string> = {
  general: "Général", order: "Commande", payment: "Paiement", technical: "Technique", refund: "Remboursement",
};

type Sender = { id: string; name: string | null; email: string; role: string };
type Message = { id: string; message: string; createdAt: string; sender: Sender };
type Agent = { id: string; name: string | null; email: string };

type Ticket = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  user: { id: string; name: string | null; email: string } | null;
  agent: { id: string; name: string | null; email: string } | null;
  order: { id: string; orderNumber: string; status: string; totalAmount: number } | null;
  messages: Message[];
};

export function TicketDetailClient({
  ticket: initial,
  agents,
  currentUserId,
}: {
  ticket: Ticket;
  agents: Agent[];
  currentUserId: string;
}) {
  const { toast } = useToast();
  const [ticket, setTicket] = useState(initial);
  const [reply, setReply] = useState("");
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket.messages.length]);

  async function updateTicket(patch: object) {
    const res = await fetch(`/api/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const updated = await res.json();
      setTicket((t) => ({ ...t, ...updated }));
      toast({ title: "Mis à jour", variant: "success" });
    }
  }

  function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    startTransition(async () => {
      const res = await fetch(`/api/tickets/${ticket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setTicket((t) => ({ ...t, messages: [...t.messages, msg] }));
        setReply("");
      } else {
        toast({ title: "Erreur envoi", variant: "error" });
      }
    });
  }

  const statusConfig = STATUS_OPTIONS.find((s) => s.value === ticket.status);

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-white mb-1">{ticket.subject}</h1>
            <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500">
              <span className="bg-gray-800 px-2 py-0.5 rounded-full">{CATEGORY_LABEL[ticket.category] ?? ticket.category}</span>
              <span>De : {ticket.user?.name ?? ticket.user?.email ?? "Anonyme"}</span>
              <span>{formatDate(ticket.createdAt)}</span>
              {ticket.order && (
                <span className="text-purple-400">Commande #{ticket.order.orderNumber} · {formatPrice(ticket.order.totalAmount)}</span>
              )}
            </div>
          </div>
          <div className={`text-sm font-semibold ${statusConfig?.color}`}>
            {statusConfig?.label}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Statut</label>
          <select
            value={ticket.status}
            onChange={(e) => updateTicket({ status: e.target.value })}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Priorité</label>
          <select
            value={ticket.priority}
            onChange={(e) => updateTicket({ priority: e.target.value })}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            {PRIORITY_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Agent assigné</label>
          <select
            value={ticket.agent?.id ?? ""}
            onChange={(e) => updateTicket({ agentId: e.target.value || null })}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">Non assigné</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.name ?? a.email}</option>)}
          </select>
        </div>
      </div>

      {/* Message thread */}
      <div className="rounded-xl border border-gray-800 bg-gray-950 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-white">Conversation ({ticket.messages.length})</span>
        </div>
        <div className="p-4 space-y-4 max-h-[480px] overflow-y-auto">
          {ticket.messages.map((msg) => {
            const isStaff = ["admin", "support"].includes(msg.sender.role);
            const isMe = msg.sender.id === currentUserId;
            return (
              <div key={msg.id} className={`flex gap-3 ${isStaff ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isStaff ? "bg-purple-900/50 border border-purple-700/40" : "bg-gray-800 border border-gray-700"}`}>
                  {isStaff ? <Shield className="h-3.5 w-3.5 text-purple-400" /> : <User className="h-3.5 w-3.5 text-gray-400" />}
                </div>
                <div className={`max-w-[75%] ${isStaff ? "items-end" : "items-start"} flex flex-col`}>
                  <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isStaff ? "bg-purple-900/30 border border-purple-700/30 text-purple-100 rounded-tr-sm" : "bg-gray-800 text-gray-200 rounded-tl-sm"}`}>
                    {msg.message}
                  </div>
                  <p className="text-xs text-gray-600 mt-1 px-1">
                    {msg.sender.name ?? msg.sender.email} · {formatDate(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply form */}
        {ticket.status !== "closed" && (
          <form onSubmit={handleReply} className="border-t border-gray-800 p-3 flex gap-2">
            <textarea
              rows={2}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleReply(e); }}
              placeholder="Répondre au client… (Ctrl+Entrée pour envoyer)"
              className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500 resize-none"
            />
            <Button type="submit" size="sm" disabled={isPending || !reply.trim()} className="self-end gap-1.5">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Envoyer
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
