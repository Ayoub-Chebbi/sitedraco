"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/use-toast";
import { Send, Loader2, User, Shield } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open:        { label: "Ouvert",    color: "text-yellow-400 bg-yellow-900/30 border-yellow-700/40" },
  in_progress: { label: "En cours", color: "text-blue-400 bg-blue-900/30 border-blue-700/40" },
  resolved:    { label: "Résolu",   color: "text-green-400 bg-green-900/30 border-green-700/40" },
  closed:      { label: "Fermé",    color: "text-gray-500 bg-gray-800 border-gray-700" },
};

type Sender = { id: string; name: string | null; email: string; role: string };
type Message = { id: string; message: string; createdAt: string; sender: Sender };
type Ticket = {
  id: string; subject: string; category: string; status: string;
  createdAt: string; resolvedAt: string | null;
  order: { orderNumber: string } | null;
  messages: Message[];
};

export function UserTicketClient({ ticket: initial, currentUserId }: { ticket: Ticket; currentUserId: string }) {
  const { toast } = useToast();
  const [ticket, setTicket] = useState(initial);
  const [reply, setReply] = useState("");
  const [isPending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket.messages.length]);

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
        toast({ title: "Erreur", description: "Impossible d'envoyer le message", variant: "error" });
      }
    });
  }

  const sc = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-white">{ticket.subject}</h1>
            <p className="text-xs text-gray-500 mt-1">Ouvert le {formatDate(ticket.createdAt)}
              {ticket.order && ` · Commande #${ticket.order.orderNumber}`}
            </p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full border ${sc.color}`}>{sc.label}</span>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-950 overflow-hidden">
        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {ticket.messages.map((msg) => {
            const isStaff = ["admin", "support"].includes(msg.sender.role);
            return (
              <div key={msg.id} className={`flex gap-3 ${isStaff ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isStaff ? "bg-purple-900/50 border border-purple-700/40" : "bg-gray-800 border border-gray-700"}`}>
                  {isStaff ? <Shield className="h-3.5 w-3.5 text-purple-400" /> : <User className="h-3.5 w-3.5 text-gray-400" />}
                </div>
                <div className={`max-w-[80%] flex flex-col ${isStaff ? "items-end" : "items-start"}`}>
                  <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isStaff ? "bg-purple-900/30 border border-purple-700/30 text-purple-100 rounded-tr-sm" : "bg-gray-800 text-gray-200 rounded-tl-sm"}`}>
                    {msg.message}
                  </div>
                  <p className="text-xs text-gray-600 mt-1 px-1">
                    {isStaff ? "Support LootStore" : "Vous"} · {formatDate(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {ticket.status !== "closed" && (
          <form onSubmit={handleReply} className="border-t border-gray-800 p-3 flex gap-2">
            <textarea
              rows={2}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleReply(e); }}
              placeholder="Votre message… (Ctrl+Entrée pour envoyer)"
              className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500 resize-none"
            />
            <Button type="submit" size="sm" disabled={isPending || !reply.trim()} className="self-end gap-1.5">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
