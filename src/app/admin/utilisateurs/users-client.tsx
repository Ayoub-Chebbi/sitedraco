"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, ChevronDown, ChevronRight, RefreshCw, ShoppingBag, Clock, CheckCircle, XCircle, Loader2, Shield, UserCog, Coins, X } from "lucide-react";
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
  paymentStatus: string;
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
  role: string;
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

const ROLE_STYLES: Record<string, { label: string; classes: string }> = {
  admin:    { label: "Admin",    classes: "bg-red-900/30 text-red-400 border border-red-800/40" },
  support:  { label: "Support",  classes: "bg-blue-900/30 text-blue-400 border border-blue-800/40" },
  customer: { label: "Client",   classes: "bg-gray-800 text-gray-400" },
};

const RECENT_MS = 5 * 60 * 1000;
function isRecent(isoDate: string) {
  return Date.now() - new Date(isoDate).getTime() < RECENT_MS;
}

function RoleSelector({ user, onChanged, isAdmin }: { user: UserRow; onChanged: (id: string, role: string) => void; isAdmin: boolean }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  if (!isAdmin) return null;

  async function changeRole(role: string) {
    if (role === user.role) { setOpen(false); return; }
    setLoading(true);
    setOpen(false);
    try {
      const res = await fetch(`/api/admin/users?id=${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) onChanged(user.id, role);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 transition-colors"
        title="Modifier le rôle"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserCog className="h-3 w-3" />}
        Rôle
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-40 rounded-xl border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden">
            {(["customer", "support", "admin"] as const).map((role) => (
              <button
                key={role}
                onClick={() => changeRole(role)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-gray-800 transition-colors ${role === user.role ? "text-purple-400 bg-gray-800/50" : "text-gray-300"}`}
              >
                {role === "admin" && <Shield className="h-3.5 w-3.5 text-red-400" />}
                {role === "support" && <Shield className="h-3.5 w-3.5 text-blue-400" />}
                {role === "customer" && <Users className="h-3.5 w-3.5 text-gray-500" />}
                {ROLE_STYLES[role].label}
                {role === user.role && <span className="ml-auto text-purple-400 text-xs">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CreditModal({ user, onClose, onCredited }: {
  user: UserRow;
  onClose: () => void;
  onCredited: (userId: string, amount: number) => void;
}) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError("Montant invalide."); return; }
    if (!description.trim()) { setError("Raison requise."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, amount: amt, description: description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur."); return; }
      setSuccess(true);
      onCredited(user.id, amt);
      setTimeout(onClose, 1500);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Coins className="h-4 w-4 text-yellow-400" />
              Créditer un compte
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{user.name ?? user.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
            <p className="text-white font-semibold">Crédit effectué !</p>
            <p className="text-gray-400 text-sm mt-1">+{parseFloat(amount).toFixed(3)} TND ajoutés</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-1.5">Montant (TND)</label>
              <input
                type="number"
                min="0.001"
                step="0.5"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex : 5.000"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-1.5">Raison</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex : Compensation retard livraison"
                maxLength={200}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-yellow-500"
              />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Annuler</Button>
              <Button
                className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white"
                onClick={submit}
                disabled={loading || !amount || !description}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coins className="h-4 w-4" />}
                Créditer
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function UsersClient({ initialUsers, isAdmin }: { initialUsers: UserRow[]; isAdmin: boolean }) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [creditTarget, setCreditTarget] = useState<UserRow | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        setUsers(await res.json());
        setLastRefresh(new Date());
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

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

  function handleRoleChanged(userId: string, newRole: string) {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
  }

  function handleCredited(userId: string, _amount: number) {
    setCreditTarget(null);
    // Refresh to get updated loyalty balance
    refresh();
  }

  const filtered = users.filter((u) => {
    if (!u) return false;
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (u.email ?? "").toLowerCase().includes(q) || (u.name ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  const validUsers = users.filter(Boolean);

  const recentOrderCount = validUsers.reduce(
    (acc, u) => acc + (u.orders ?? []).filter((o) => isRecent(o.createdAt)).length, 0
  );

  const counts = {
    all: validUsers.length,
    customer: validUsers.filter(u => u.role === "customer").length,
    support: validUsers.filter(u => u.role === "support").length,
    admin: validUsers.filter(u => u.role === "admin").length,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {creditTarget && (
        <CreditModal
          user={creditTarget}
          onClose={() => setCreditTarget(null)}
          onCredited={handleCredited}
        />
      )}
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-purple-400 shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Utilisateurs</h1>
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
          <p className="text-xs text-gray-600 hidden sm:block">Mis à jour {formatDate(lastRefresh)}</p>
          <Button variant="ghost" size="sm" onClick={refresh} disabled={isRefreshing} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou email…"
          className="flex-1 min-w-48 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
        />
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
          {(["all", "customer", "support", "admin"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                roleFilter === r ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {r === "all" ? "Tous" : ROLE_STYLES[r].label} ({counts[r]})
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>Aucun utilisateur trouvé</p>
          </div>
        )}

        {filtered.map((user) => {
          const isOpen = expanded.has(user.id);
          const totalSpent = user.orders
            .filter((o) => o.paymentStatus === "paid")
            .reduce((s, o) => s + o.totalAmount, 0);
          const hasRecentOrder = user.orders.some((o) => isRecent(o.createdAt));
          const roleStyle = ROLE_STYLES[user.role] ?? ROLE_STYLES.customer;

          return (
            <div
              key={user.id}
              className={`rounded-xl border transition-colors ${hasRecentOrder ? "border-green-700/50 bg-green-950/10" : "border-gray-800 bg-gray-900"}`}
            >
              <div className="flex items-center gap-3 px-4 py-3.5">
                {/* Avatar */}
                <button className="w-9 h-9 rounded-full bg-purple-900/50 border border-purple-700/40 flex items-center justify-center text-purple-300 font-bold text-sm shrink-0" onClick={() => toggleExpand(user.id)}>
                  {(user.name || user.email || "?").charAt(0).toUpperCase()}
                </button>

                {/* Info */}
                <button className="flex-1 min-w-0 text-left" onClick={() => toggleExpand(user.id)}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white truncate">{user.name ?? "—"}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${roleStyle.classes}`}>{roleStyle.label}</span>
                    {user.isVerified && (
                      <span className="text-xs text-green-400 bg-green-900/30 px-1.5 py-0.5 rounded-full">✓ Vérifié</span>
                    )}
                    {hasRecentOrder && (
                      <span className="text-xs text-green-300 bg-green-900/40 border border-green-700/40 px-1.5 py-0.5 rounded-full animate-pulse">Achat récent</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </button>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-5 shrink-0">
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

                {/* Role selector + credit + expand */}
                <div className="flex items-center gap-2 shrink-0">
                  {isAdmin && user.role === "customer" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setCreditTarget(user); }}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-yellow-900/30 hover:bg-yellow-900/50 border border-yellow-700/40 text-yellow-400 transition-colors"
                      title="Créditer le compte"
                    >
                      <Coins className="h-3 w-3" />
                      Créditer
                    </button>
                  )}
                  <RoleSelector user={user} onChanged={handleRoleChanged} isAdmin={isAdmin} />
                  <button onClick={() => toggleExpand(user.id)} className="text-gray-600 hover:text-gray-400 transition-colors">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                </div>
              </div>

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
                                {recent && <span className="text-xs text-green-400 font-medium">• Nouveau</span>}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
                                <span className="text-sm font-bold text-white">{formatPrice(order.totalAmount)}</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {order.items.map((item) => (
                                <span key={item.id} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">
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
