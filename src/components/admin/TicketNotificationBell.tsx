"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, MessageSquare, Clock } from "lucide-react";

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

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
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

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const newCount = tickets.filter((t) => t.status === "open").length;

  return (
    <div ref={ref} className="relative shrink-0">
      {/* Bell button */}
      <button
        onClick={() => { setOpen((o) => !o); if (!open) fetchTickets(); }}
        className="relative p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
        title="Tickets support"
      >
        <Bell className="h-4 w-4" />
        {newCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500 border border-gray-950" />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-9 w-72 rounded-xl border border-gray-800 bg-gray-950 shadow-xl shadow-black/40 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-800">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-white">Tickets ouverts</span>
              {tickets.length > 0 && (
                <span className="text-[10px] font-bold bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded-full">
                  {tickets.length}
                </span>
              )}
            </div>
            <Link
              href="/admin/tickets"
              onClick={() => setOpen(false)}
              className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors"
            >
              Voir tout →
            </Link>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && tickets.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-gray-600">Chargement…</p>
            ) : tickets.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <Bell className="h-6 w-6 text-gray-800 mx-auto mb-1.5" />
                <p className="text-xs text-gray-600">Aucun ticket ouvert</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800/50">
                {tickets.map((ticket) => {
                  const lastRole = ticket.messages[0]?.sender.role;
                  const awaitingReply = lastRole !== "admin" && lastRole !== "support";
                  const isNew = ticket.status === "open";

                  return (
                    <Link
                      key={ticket.id}
                      href={`/admin/tickets/${ticket.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-gray-800/40 transition-colors group"
                    >
                      {/* Dot */}
                      <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${isNew ? "bg-green-500" : "bg-yellow-500"}`} />

                      <div className="flex-1 min-w-0">
                        {/* Subject */}
                        <p className="text-xs font-medium text-gray-200 truncate group-hover:text-white leading-snug">
                          {ticket.subject}
                        </p>
                        {/* Meta */}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-gray-500 truncate">
                            {ticket.user?.name ?? ticket.user?.email ?? "Client"}
                          </span>
                          {ticket.order && (
                            <span className="text-[11px] text-gray-700 shrink-0">
                              #{ticket.order.orderNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right side */}
                      <div className="shrink-0 flex flex-col items-end gap-1 pt-0.5">
                        <span className="text-[10px] text-gray-600 flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {timeAgo(ticket.createdAt)}
                        </span>
                        {awaitingReply && (
                          <span className="text-[9px] font-semibold bg-purple-900/50 text-purple-400 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                            À répondre
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
