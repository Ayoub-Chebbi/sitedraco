import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, MessageCircle, Clock, CheckCircle } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open:        { label: "Ouvert",    color: "bg-yellow-900/40 text-yellow-400 border border-yellow-700/40" },
  in_progress: { label: "En cours", color: "bg-blue-900/40 text-blue-400 border border-blue-700/40" },
  resolved:    { label: "Résolu",   color: "bg-green-900/40 text-green-400 border border-green-700/40" },
  closed:      { label: "Fermé",    color: "bg-gray-800 text-gray-500 border border-gray-700" },
};

export default async function SupportPage() {
  const session = await auth();
  if (!session) redirect("/connexion");

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { messages: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { message: true, createdAt: true } },
    },
    orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Support</h1>
          <p className="text-sm text-gray-500">{tickets.length} ticket{tickets.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/dashboard/support/nouveau">
          <Button className="gap-2"><Plus className="h-4 w-4" />Nouveau ticket</Button>
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-dashed border-gray-800">
          <MessageCircle className="h-10 w-10 mx-auto mb-3 text-gray-700" />
          <p className="text-gray-400 font-medium">Aucun ticket</p>
          <p className="text-gray-600 text-sm mt-1">Vous pouvez créer un ticket pour toute demande d&apos;assistance.</p>
          <Link href="/dashboard/support/nouveau">
            <Button className="mt-4 gap-2"><Plus className="h-4 w-4" />Créer un ticket</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const sc = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.open;
            return (
              <Link
                key={t.id}
                href={`/dashboard/support/${t.id}`}
                className="block p-4 rounded-xl border border-gray-800 bg-gray-900 hover:border-purple-700/40 hover:bg-gray-800/50 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
                    </div>
                    <p className="text-sm font-semibold text-white truncate">{t.subject}</p>
                    {t.messages[0] && (
                      <p className="text-xs text-gray-500 mt-1 truncate">{t.messages[0].message}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">{formatDate(t.createdAt)}</p>
                    <p className="text-xs text-gray-600 mt-1">{t._count.messages} messages</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
