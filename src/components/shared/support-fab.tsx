"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MessageCircle, X, Send, Loader2, ChevronRight,
  Headphones, Plus, Clock, CheckCircle, Circle,
} from "lucide-react";

type Ticket = {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  messages: { id: string }[];
};

const STATUS_DOT: Record<string, { icon: typeof Circle; color: string }> = {
  open:        { icon: Circle,       color: "text-yellow-400" },
  in_progress: { icon: Clock,        color: "text-blue-400"   },
  resolved:    { icon: CheckCircle,  color: "text-green-400"  },
  closed:      { icon: CheckCircle,  color: "text-gray-500"   },
};

export function SupportFab() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"home" | "new">("home");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // fetch recent tickets when panel opens for a logged-in user
  useEffect(() => {
    if (!open || !session) return;
    setLoadingTickets(true);
    fetch("/api/tickets")
      .then((r) => r.json())
      .then((data) => setTickets(Array.isArray(data) ? data.slice(0, 3) : []))
      .finally(() => setLoadingTickets(false));
  }, [open, session]);

  function resetForm() {
    setSubject(""); setMessage(""); setSent(false); setView("home");
  }

  function handleClose() {
    setOpen(false);
    setTimeout(resetForm, 300);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          category: "general",
          priority: "normal",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSent(true);
        setTimeout(() => {
          handleClose();
          router.push(`/dashboard/support/${data.id}`);
        }, 1600);
      }
    } finally {
      setSending(false);
    }
  }

  const firstName = session?.user.name?.split(" ")[0] ?? session?.user.email?.split("@")[0] ?? "";

  return (
    <>
      {/* ── Chat panel ── */}
      <div
        className={`fixed bottom-24 right-5 z-50 w-[340px] rounded-2xl border border-gray-700/80 bg-gray-900 shadow-2xl shadow-black/70 overflow-hidden transition-all duration-300 origin-bottom-right ${
          open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-90 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="bg-linear-to-r from-purple-700 to-pink-600 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Headphones className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Support Loot</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <p className="text-xs text-purple-100">En ligne · répond en &lt; 1h</p>
              </div>
            </div>
          </div>
          <button onClick={handleClose} className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 max-h-[420px] overflow-y-auto">

          {/* Not authenticated */}
          {status === "unauthenticated" && (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">👋</div>
              <p className="text-base font-semibold text-white mb-1">Bonjour !</p>
              <p className="text-xs text-gray-400 mb-5 leading-relaxed">
                Connectez-vous pour démarrer une conversation avec notre équipe de support.
              </p>
              <Link
                href="/connexion"
                onClick={handleClose}
                className="block w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-colors text-center"
              >
                Se connecter
              </Link>
              <Link
                href="/inscription"
                onClick={handleClose}
                className="block w-full mt-2 py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-xl transition-colors text-center border border-gray-700"
              >
                Créer un compte
              </Link>
            </div>
          )}

          {/* Loading */}
          {status === "loading" && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
            </div>
          )}

          {/* Sent */}
          {status === "authenticated" && sent && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-sm font-semibold text-white mb-1">Message envoyé !</p>
              <p className="text-xs text-gray-400">Redirection vers votre conversation…</p>
            </div>
          )}

          {/* Home view */}
          {status === "authenticated" && !sent && view === "home" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                Bonjour {firstName} 👋&nbsp; Comment peut-on vous aider ?
              </p>

              {/* New conversation button */}
              <button
                onClick={() => setView("new")}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-800 hover:bg-gray-750 hover:border-purple-700/40 border border-gray-700/60 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-900/50 border border-purple-700/40 flex items-center justify-center group-hover:bg-purple-800/50 transition-colors">
                    <Plus className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Nouvelle conversation</p>
                    <p className="text-xs text-gray-500">Posez votre question</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
              </button>

              {/* Recent tickets */}
              {loadingTickets ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                </div>
              ) : tickets.length > 0 ? (
                <div>
                  <p className="text-xs text-gray-600 mb-2 px-1">Conversations récentes</p>
                  <div className="space-y-1.5">
                    {tickets.map((t) => {
                      const s = STATUS_DOT[t.status] ?? STATUS_DOT.open;
                      return (
                        <Link
                          key={t.id}
                          href={`/dashboard/support/${t.id}`}
                          onClick={handleClose}
                          className="flex items-center justify-between p-3 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700/60 transition-all group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <s.icon className={`h-3.5 w-3.5 shrink-0 ${s.color}`} />
                            <p className="text-sm text-gray-300 truncate group-hover:text-white transition-colors">{t.subject}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className="text-xs text-gray-600">{t.messages.length}</span>
                            <MessageCircle className="h-3 w-3 text-gray-600" />
                            <ChevronRight className="h-3.5 w-3.5 text-gray-700" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <Link
                    href="/dashboard/support"
                    onClick={handleClose}
                    className="block text-center text-xs text-purple-400 hover:text-purple-300 mt-3 transition-colors"
                  >
                    Voir toutes les conversations →
                  </Link>
                </div>
              ) : null}
            </div>
          )}

          {/* New ticket form */}
          {status === "authenticated" && !sent && view === "new" && (
            <form onSubmit={handleSend} className="space-y-3">
              <button
                type="button"
                onClick={() => setView("home")}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1 mb-1"
              >
                ← Retour
              </button>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Sujet</label>
                <input
                  required
                  minLength={5}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex : Clé non reçue, problème de paiement…"
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Message</label>
                <textarea
                  required
                  minLength={10}
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleSend(e as any); }}
                  placeholder="Décrivez votre problème en détail… (Ctrl+Entrée pour envoyer)"
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500 resize-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={sending || !subject.trim() || !message.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-purple-900/30"
              >
                {sending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi…</>
                  : <><Send className="h-4 w-4" /> Envoyer</>
                }
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Support"
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-linear-to-br from-purple-600 to-pink-600 text-white shadow-2xl shadow-purple-900/50 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
      >
        <div className={`transition-all duration-200 ${open ? "rotate-90 scale-0 absolute" : "rotate-0 scale-100"}`}>
          <MessageCircle className="h-6 w-6" />
        </div>
        <div className={`transition-all duration-200 ${open ? "rotate-0 scale-100" : "-rotate-90 scale-0 absolute"}`}>
          <X className="h-6 w-6" />
        </div>
      </button>
    </>
  );
}
