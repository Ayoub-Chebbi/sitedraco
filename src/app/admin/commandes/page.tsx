export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Search } from "lucide-react";
import { CommandesTable } from "./commandes-table";

export default async function AdminCommandesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; payment?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session || !["admin", "support"].includes(session.user.role)) redirect("/");

  const params = await searchParams;
  const statusFilter  = params.status  || "all";
  const paymentFilter = params.payment || "";
  const query         = (params.q || "").trim();

  // Build where clause — search takes priority over status/payment filters
  const searchWhere = query ? {
    OR: [
      { orderNumber: { contains: query, mode: "insensitive" as const } },
      { user: { email: { contains: query, mode: "insensitive" as const } } },
      { user: { name: { contains: query, mode: "insensitive" as const } } },
      { guestEmail: { contains: query, mode: "insensitive" as const } },
    ],
  } : null;

  const statusWhere =
    paymentFilter === "awaiting_verification"
      ? { paymentStatus: "awaiting_verification", NOT: { status: "failed" } }
      : statusFilter === "failed"
      ? { OR: [{ status: "failed" }, { status: { not: "failed" }, paymentStatus: "failed" }] }
      : statusFilter !== "all"
      ? { status: statusFilter }
      : null;

  const where = searchWhere && statusWhere
    ? { AND: [searchWhere, statusWhere] }
    : searchWhere ?? statusWhere ?? undefined;

  const [orders, awaitingCount] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        paymentProofUrl: true,
        totalAmount: true,
        guestEmail: true,
        createdAt: true,
        items: { include: { product: { select: { name: true } } } },
        user: { select: { email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count({ where: { paymentStatus: "awaiting_verification", NOT: { status: "failed" } } }),
  ]);

  const activeTab = paymentFilter === "awaiting_verification" ? "verif" : statusFilter;

  const TABS = [
    { value: "all",        label: "Toutes",         href: "/admin/commandes" },
    { value: "verif",      label: `À vérifier${awaitingCount > 0 ? ` (${awaitingCount})` : ""}`, href: "/admin/commandes?payment=awaiting_verification", amber: true },
    { value: "pending",    label: "En attente",      href: "/admin/commandes?status=pending" },
    { value: "processing", label: "En traitement",   href: "/admin/commandes?status=processing" },
    { value: "delivered",  label: "Livrées",         href: "/admin/commandes?status=delivered" },
    { value: "failed",     label: "Échouées",        href: "/admin/commandes?status=failed" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-gray-500 hover:text-gray-300 text-sm">Admin</Link>
        <span className="text-gray-700">/</span>
        <h1 className="text-xl font-bold text-white">Commandes</h1>
        <span className="text-gray-500 text-sm">({orders.length})</span>
      </div>

      {/* Search bar */}
      <form method="GET" action="/admin/commandes" className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          <input
            name="q"
            defaultValue={query}
            placeholder="N° commande ou email client…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
          />
          {query && (
            <Link
              href="/admin/commandes"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs"
            >
              ✕
            </Link>
          )}
        </div>
        {query && (
          <p className="text-xs text-gray-500 mt-2">
            {orders.length} résultat{orders.length !== 1 ? "s" : ""} pour « {query} »
          </p>
        )}
      </form>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => (
          <Link key={tab.value} href={tab.href}>
            <button className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.value
                ? tab.amber
                  ? "bg-amber-600 text-white"
                  : "bg-purple-600 text-white"
                : tab.amber && awaitingCount > 0
                ? "text-amber-400 hover:text-white hover:bg-amber-800/40"
                : "text-gray-400 hover:text-white"
            }`}>
              {tab.label}
            </button>
          </Link>
        ))}
      </div>

      <CommandesTable
        activeTab={activeTab}
        orders={orders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() }))}
      />
    </div>
  );
}
