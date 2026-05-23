"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, ChevronDown, ChevronRight, RefreshCw, ShoppingBag, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { formatPrice, formatDate, ORDER_STATUS_LABELS } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type OrderItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  productName: string;
  platform: string;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paymentMethod: string | null;
  createdAt: string;
  items: OrderItem[];
};

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  isVerified: boolean;
  createdAt: string;
  lastLogin: string | null;
  orders: Order[];
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  delivered: <CheckCircle className="h-3.5 w-3.5 text-green-400" />,
  pending: <Clock className="h-3.5 w-3.5 text-yellow-400" />,
  processing: <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin" />,
  failed: <XCircle className="h-3.5 w-3.5 text-red-400" />,
  refunded: <XCircle className="h-3.5 w-3.5 text-gray-400" />,
};

const RECENT_MS = 5 * 60 * 1000; // 5 minutes

function isRecent(isoDate: string) {
  return Date.now() - new Date(isoDate).getTime() < RECENT_MS;
}

export function UsersClient({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [search, setSearch] = useState("");

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        setLastRefresh(new Date());
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Auto-refresh every 30s to show new purchases
  useEffect(() => {
    const timer = setInterval(refresh, 30_000);
    return () => clearInterval(timer);
  }, [refresh]);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          (u.name ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : users;

  // Detect any recent orders across all users
  const recentOrderCount = users.reduce(
    (acc, u) => acc + u.orders.filter((o) => isRecent(o.createdAt)).length,
    0
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Clients</h1>
            <p className="text-sm text-gray-500">{users.length} utilisateur{users.length !== 1 ? "s" : ""}</p>
          </div>
          {recentOrderCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-900/40 border border-green-700/50 text-green-400 text-xs font-semibold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              {recentOrderCount} achat{recentOrderCount > 1 ? "s" : ""} récent{recentOrderCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-600 hidden sm:block">
            Mis à jour {formatDate(lastRefresh)}
          </p>
          <Button variant="ghost" size="sm" onClick={refresh} disabled={isRefreshing} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou email…"
          className="w-full max-w-sm rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>Aucun client trouvé</p>
          </div>
        )}

        {filtered.map((user) => {
          const isOpen = expanded.has(user.id);
          const totalSpent = user.orders
            .filter((o) => o.status === "delivered")
            .reduce((s, o) => s + o.totalAmount, 0);
          const hasRecentOrder = user.orders.some((o) => isRecent(o.createdAt));

          return (
            <div
              key={user.id}
              className={`rounded-xl border transition-colors ${hasRecentOrder ? "border-green-700/50 bg-green-950/10" : "border-gray-800 bg-gray-900"}`}
            >
              {/* User row */}
              <button
                className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-gray-800/30 transition-colors rounded-xl"
                onClick={() => toggleExpand(user.id)}
              >
                <div className="w-9 h-9 rounded-full bg-purple-900/50 border border-purple-700/40 flex items-center justify-center text-purple-300 font-bold text-sm shrink-0">
                  {(user.name ?? user.email)[0].toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white truncate">{user.name ?? "—"}</p>
                    {user.isVerified && (
                      <span className="text-xs text-green-400 bg-green-900/30 px-1.5 py-0.5 rounded-full">✓ Vérifié</span>
                    )}
                    {hasRecentOrder && (
                      <span className="text-xs text-green-300 bg-green-900/40 border border-green-700/40 px-1.5 py-0.5 rounded-full animate-pulse">
                        Achat récent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>

                <div className="hidden sm:flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Commandes</p>
                    <div className="flex items-center gap-1 justify-end">
                      <ShoppingBag className="h-3 w-3 text-gray-500" />
                      <span className="text-sm font-semibold text-white">{user.orders.length}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Dépensé</p>
                    <p className="text-sm font-semibold text-white">{formatPrice(totalSpent)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Inscrit</p>
                    <p className="text-xs text-gray-400">{formatDate(user.createdAt)}</p>
                  </div>
                </div>

                <div className="shrink-0 text-gray-600">
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </button>

              {/* Orders panel */}
              {isOpen && (
                <div className="border-t border-gray-800 px-4 pb-4 pt-3">
                  {user.orders.length === 0 ? (
                    <p className="text-sm text-gray-500 py-3 text-center">Aucune commande</p>
                  ) : (
                    <div className="space-y-2">
                      {user.orders.map((order) => {
                        const statusInfo = ORDER_STATUS_LABELS[order.status] ?? { label: order.status, color: "" };
                        const recent = isRecent(order.createdAt);
                        return (
                          <div
                            key={order.id}
                            className={`rounded-lg border p-3 ${recent ? "border-green-700/40 bg-green-950/20" : "border-gray-800 bg-gray-950"}`}
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                              <div className="flex items-center gap-2">
                                {STATUS_ICONS[order.status] ?? null}
                                <span className="text-sm font-mono text-gray-300">{order.orderNumber}</span>
                                {recent && (
                                  <span className="text-xs text-green-400 font-medium">• Nouveau</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
                                <span className="text-sm font-bold text-white">{formatPrice(order.totalAmount)}</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {order.items.map((item) => (
                                <span
                                  key={item.id}
                                  className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full"
                                >
                                  {item.quantity > 1 && <span className="text-purple-400 font-medium">{item.quantity}× </span>}
                                  {item.productName}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
