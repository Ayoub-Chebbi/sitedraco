import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Ticket, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open:        { label: "Ouvert",       color: "bg-yellow-900/40 text-yellow-400 border-yellow-700/40",     icon: <Clock className="h-3 w-3" /> },
  in_progress: { label: "En cours",     color: "bg-blue-900/40 text-blue-400 border-blue-700/40",           icon: <Loader2 className="h-3 w-3" /> },
  resolved:    { label: "Résolu",       color: "bg-green-900/40 text-green-400 border-green-700/40",        icon: <CheckCircle className="h-3 w-3" /> },
  closed:      { label: "Fermé",        color: "bg-gray-800 text-gray-500 border-gray-700",                 icon: <CheckCircle className="h-3 w-3" /> },
};

const PRIORITY_COLOR: Record<string, string> = {
  low:    "text-gray-500",
  normal: "text-blue-400",
  high:   "text-orange-400",
  urgent: "text-red-400 font-bold",
};

const CATEGORY_LABEL: Record<string, string> = {
  general:   "Général",
  order:     "Commande",
  payment:   "Paiement",
  technical: "Technique",
  refund:    "Remboursement",
};

export default async function AdminTicketsPage() {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) redirect("/");

  const tickets = await prisma.supportTicket.findMany({
    include: {
      user: { select: { name: true, email: true } },
      agent: { select: { name: true } },
      order: { select: { orderNumber: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const open = tickets.filter((t) => t.status === "open").length;
  const inProgress = tickets.filter((t) => t.status === "in_progress").length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Ticket className="h-6 w-6 text-purple-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Tickets support</h1>
          <p className="text-sm text-gray-500">{tickets.length} total · {open} ouverts · {inProgress} en cours</p>
        </div>
      </div>

      <div className="space-y-2">
        {tickets.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <Ticket className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>Aucun ticket pour l&apos;instant</p>
          </div>
        )}
        {tickets.map((t) => {
          const sc = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.open;
          return (
            <Link
              key={t.id}
              href={`/admin/tickets/${t.id}`}
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-800 bg-gray-900 hover:border-purple-700/40 hover:bg-gray-800/50 transition-all group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${sc.color}`}>
                    {sc.icon} {sc.label}
                  </span>
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
                <p className="text-sm font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                  {t.subject}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t.user?.name ?? t.user?.email ?? "Anonyme"} · {formatDate(t.createdAt)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-gray-500">{t._count.messages} msg</p>
                {t.agent && <p className="text-xs text-purple-400 mt-0.5">@{t.agent.name}</p>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
