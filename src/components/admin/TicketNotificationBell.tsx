"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, MessageSquare, Clock, ChevronRight } from "lucide-react";

type Ticket = {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  _count: { messages: number };
  user: { name: string | null; email: string } | null;
  order: { orderNumber: string } | null;
  messages: { sender: { role: string } }[];
};

const STATUS_COLOR: Record<string, string> = {
  open: "bg-green-500",
  in_progress: "bg-yellow-500",
};

const STATUS_LABEL: Record<string, string> = {
  open: "Nouveau",
  in_progress: "En cours",
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

export function TicketNotificationBell() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function fetchTickets() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tickets/unread");
      if (res.ok) setTickets(await res.json());
    } finally {
      setLoading(false);
    }
  }

  // Poll every 30 seconds
  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const newCount = tickets.filter((t) => t.status === "open").length;
  const hasNew = newCount > 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen((o) => !o); if (!open) fetchTickets(); }}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 transition-colors"
        title="Tickets support"
      >
        <Bell className="h-4 w-4 text-gray-400" />
        {hasNew && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white leading-none border-2 border-gray-950">
            {newCount > 9 ? "9+" : newCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-semibold text-white">Tickets ouverts</span>
              {tickets.length > 0 && (
                <span className="text-xs text-gray-500">({tickets.length})</span>
              )}
            </div>
            <Link
              href="/admin/tickets"
              onClick={() => setOpen(false)}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              Voir tout
            </Link>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-800/60">
            {loading && tickets.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">Chargement…</div>
            ) : tickets.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="h-8 w-8 text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Aucun ticket ouvert</p>
              </div>
            ) : (
              tickets.map((ticket) => {
                const lastSenderRole = ticket.messages[0]?.sender.role;
                const awaitingReply = lastSenderRole !== "admin" && lastSenderRole !== "support";
                return (
                  <Link
                    key={ticket.id}
                    href={`/admin/tickets/${ticket.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-800/60 transition-colors group"
                  >
                    {/* Status dot */}
                    <div className="mt-1.5 shrink-0">
                      <span className={`block w-2 h-2 rounded-full ${STATUS_COLOR[ticket.status] ?? "bg-gray-500"}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          ticket.status === "open"
                            ? "bg-green-900/40 text-green-400"
                            : "bg-yellow-900/40 text-yellow-400"
                        }`}>
                          {STATUS_LABEL[ticket.status]}
                        </span>
                        {awaitingReply && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-900/40 text-purple-400">
                            Attend réponse
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-200 truncate group-hover:text-white">
                        {ticket.subject}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500 truncate">
                          {ticket.user?.name ?? ticket.user?.email ?? "Client"}
                        </span>
                        {ticket.order && (
                          <span className="text-xs text-gray-600 shrink-0">
                            #{ticket.order.orderNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Clock className="h-3 w-3" />
                        {timeAgo(ticket.createdAt)}
                      </div>
                      <div className="flex items-center gap-0.5 text-xs text-gray-600">
                        <MessageSquare className="h-3 w-3" />
                        {ticket._count.messages}
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-gray-700 group-hover:text-gray-400 transition-colors shrink-0 mt-1" />
                  </Link>
                );
              })
            )}
          </div>

          {tickets.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-800 bg-gray-900/50">
              <Link
                href="/admin/tickets"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium"
              >
                Gérer tous les tickets <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
