import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Ticket, Clock, CheckCircle, Loader2, MessageCircle, AlertCircle } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open:        { label: "Ouvert",    color: "bg-yellow-900/40 text-yellow-400 border-yellow-700/40", icon: <Clock className="h-3 w-3" /> },
  in_progress: { label: "En cours",  color: "bg-blue-900/40 text-blue-400 border-blue-700/40",       icon: <Loader2 className="h-3 w-3" /> },
  resolved:    { label: "Résolu",    color: "bg-green-900/40 text-green-400 border-green-700/40",    icon: <CheckCircle className="h-3 w-3" /> },
  closed:      { label: "Fermé",     color: "bg-gray-800 text-gray-500 border-gray-700",              icon: <CheckCircle className="h-3 w-3" /> },
};

const PRIORITY_COLOR: Record<string, string> = {
  low: "text-gray-500", normal: "text-blue-400", high: "text-orange-400", urgent: "text-red-400 font-bold",
};

const CATEGORY_LABEL: Record<string, string> = {
  general: "Général", order: "Commande", payment: "Paiement",
  technical: "Technique", refund: "Remboursement",
};

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) redirect("/");

  const { tab = "active" } = await searchParams;

  const tickets = await prisma.supportTicket.findMany({
    include: {
      user: { select: { name: true, email: true } },
      agent: { select: { name: true } },
      order: { select: { orderNumber: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: { select: { role: true } } },
      },
      _count: { select: { messages: true } },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  const activeTickets = tickets.filter((t) => t.status === "open" || t.status === "in_progress");
  const closedTickets = tickets.filter((t) => t.status === "resolved" || t.status === "closed");

  const awaitingReply = (t: typeof tickets[0]) => {
    const lastSenderRole = t.messages[0]?.sender?.role;
    return lastSenderRole !== "admin" && lastSenderRole !== "support";
  };

  const needsReplyCount = activeTickets.filter(awaitingReply).length;
  const displayed = tab === "closed" ? closedTickets : activeTickets;

  const TABS = [
    { key: "active", label: "Actifs", count: activeTickets.length, badge: needsReplyCount },
    { key: "closed", label: "Fermés", count: closedTickets.length },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Ticket className="h-6 w-6 text-purple-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Tickets support</h1>
          <p className="text-sm text-gray-500">
            {activeTickets.length} actif{activeTickets.length !== 1 ? "s" : ""}
            {needsReplyCount > 0 && ` · ${needsReplyCount} en attente de réponse`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <Link key={t.key} href={`/admin/tickets?tab=${t.key}`}>
            <button className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
            }`}>
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                tab === t.key ? "bg-purple-500 text-white" : "bg-gray-800 text-gray-400"
              }`}>
                {t.count}
              </span>
              {t.badge !== undefined && t.badge > 0 && (
                <span className="text-xs bg-amber-500 text-black font-bold px-1.5 py-0.5 rounded-full">
                  {t.badge}
                </span>
              )}
            </button>
          </Link>
        ))}
      </div>

      {/* Ticket list */}
      <div className="space-y-2">
        {displayed.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <Ticket className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>Aucun ticket {tab === "closed" ? "fermé" : "actif"}</p>
          </div>
        )}

        {displayed.map((t) => {
          const sc = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.open;
          const needsReply = awaitingReply(t);
          const isActive = tab !== "closed";

          return (
            <Link
              key={t.id}
              href={`/admin/tickets/${t.id}`}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all group ${
                needsReply && isActive
                  ? "border-amber-700/50 bg-amber-900/5 hover:bg-amber-900/10"
                  : "border-gray-800 bg-gray-900 hover:border-purple-700/40 hover:bg-gray-800/50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${sc.color}`}>
                    {sc.icon} {sc.label}
                  </span>
                  {needsReply && isActive && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-300 border border-amber-700/40 font-semibold">
                      <MessageCircle className="h-3 w-3" /> À répondre
                    </span>
                  )}
                  <span className={`text-xs ${PRIORITY_COLOR[t.priority] ?? "text-gray-400"}`}>
                    ↑ {t.priority}
                  </span>
                  <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
                    {CATEGORY_LABEL[t.category] ?? t.category}
                  </span>
                  {t.order && (
                    <span className="text-xs text-gray-600">#{t.order.orderNumber}</span>
                  )}
                </div>
                <p className={`text-sm font-semibold truncate transition-colors ${
                  needsReply && isActive ? "text-amber-200 group-hover:text-amber-100" : "text-white group-hover:text-purple-300"
                }`}>
                  {t.subject}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t.user?.name ?? t.user?.email ?? "Anonyme"} · {formatDate(t.createdAt)}
                </p>
              </div>
              <div className="shrink-0 text-right space-y-1">
                <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                  <AlertCircle className="h-3 w-3" /> {t._count.messages} msg
                </p>
                {t.agent && <p className="text-xs text-purple-400">@{t.agent.name}</p>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
