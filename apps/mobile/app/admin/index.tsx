import React from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, StyleSheet, RefreshControl, Dimensions, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getAdminStats, type AdminStats } from "@/api/admin";
import { useAuthStore } from "@/store/auth";

const { width } = Dimensions.get("window");
type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const METHOD_LABEL: Record<string, string> = {
  flouci: "Carte bancaire", d17: "D17", flouci_app: "Flouci", virement: "Virement",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b", processing: "#3b82f6", delivered: "#10b981",
  failed: "#ef4444", refunded: "#8b5cf6",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "En attente", processing: "En cours", delivered: "Livrée",
  failed: "Échouée", refunded: "Remboursée",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function KPICard({
  icon, label, value, sub, positive, color, onPress,
}: {
  icon: IoniconName; label: string; value: string; sub?: string;
  positive?: boolean; color: string; onPress?: () => void;
}) {
  const card = (
    <View style={[styles.kpiCard, { borderColor: color + "30" }]}>
      <View style={[styles.kpiIconWrap, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {sub && (
        <Text style={[styles.kpiSub, { color: positive !== false ? "#4ade80" : "#f87171" }]}>
          {sub}
        </Text>
      )}
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.8}>{card}</TouchableOpacity>;
  return card;
}

function SparkBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(6, (value / max) * 100) : 6;
  return (
    <View style={styles.sparkBarWrap}>
      <View style={[styles.sparkBarFill, { height: `${pct}%` as any, backgroundColor: value > 0 ? color : "#1f1f35" }]} />
    </View>
  );
}

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{action} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function NavCard({ icon, title, subtitle, onPress, color, badge }: {
  icon: IoniconName; title: string; subtitle: string;
  onPress: () => void; color: string; badge?: number;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.navCard}>
      <View style={[styles.navIconWrap, { backgroundColor: color + "25" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.navTitle}>{title}</Text>
        <Text style={styles.navSub}>{subtitle}</Text>
      </View>
      {badge !== undefined && badge > 0 && (
        <View style={styles.navBadge}><Text style={styles.navBadgeText}>{badge}</Text></View>
      )}
      <Ionicons name="chevron-forward" size={15} color="#4b5563" />
    </TouchableOpacity>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { data: stats, isLoading, refetch, isRefetching } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: getAdminStats,
    staleTime: 60_000,
  });

  if (user?.role !== "admin") {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="lock-closed" size={48} color="#4b5563" />
        <Text style={styles.errorText}>Accès réservé aux administrateurs</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const maxRevenue = Math.max(...(stats?.dailyRevenue?.map(d => d.revenue) ?? [1]), 1);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#a78bfa" colors={["#a78bfa"]} />}
    >
      {/* Header */}
      <LinearGradient colors={["#1e1035", "#0d0d14"]} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={20} color="#a78bfa" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Dashboard Admin</Text>
          <Text style={styles.headerSub}>Paiements confirmés uniquement</Text>
        </View>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={11} color="#a78bfa" />
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#a78bfa" />
          <Text style={styles.loadingText}>Chargement…</Text>
        </View>
      ) : !stats ? null : (
        <>
          {/* Alert banners */}
          {(stats.awaitingVerification > 0 || stats.pendingOrders > 0) && (
            <View style={styles.alerts}>
              {stats.awaitingVerification > 0 && (
                <TouchableOpacity style={styles.alertAmber} onPress={() => router.push("/admin/orders")} activeOpacity={0.8}>
                  <Ionicons name="time-outline" size={14} color="#fbbf24" />
                  <Text style={styles.alertAmberText}>{stats.awaitingVerification} justificatif{stats.awaitingVerification > 1 ? "s" : ""} à vérifier</Text>
                </TouchableOpacity>
              )}
              {stats.pendingOrders > 0 && (
                <TouchableOpacity style={styles.alertRed} onPress={() => router.push("/admin/orders")} activeOpacity={0.8}>
                  <Ionicons name="alert-circle-outline" size={14} color="#f87171" />
                  <Text style={styles.alertRedText}>{stats.pendingOrders} commande{stats.pendingOrders > 1 ? "s" : ""} en attente</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Revenue cards */}
          <View style={styles.section}>
            <SectionHeader title="Revenus" />
            <View style={styles.revenueRow}>
              <LinearGradient colors={["#7c3aed", "#4c1d95"]} style={styles.revenueCard}>
                <Text style={styles.revenueLabel}>Total</Text>
                <Text style={styles.revenueValue}>{stats.totalRevenue.toFixed(0)} TND</Text>
                <Text style={styles.revenueSub}>{stats.paidOrdersCount} commandes payées</Text>
              </LinearGradient>
              <View style={{ gap: 8, flex: 1 }}>
                <LinearGradient colors={["#0e7490", "#164e63"]} style={[styles.revenueCard, { padding: 12 }]}>
                  <Text style={styles.revenueLabel}>Ce mois</Text>
                  <Text style={[styles.revenueValue, { fontSize: 17 }]}>{stats.monthRevenue.toFixed(0)} TND</Text>
                  <Text style={[styles.revenueSub, { color: stats.revenueGrowth >= 0 ? "#4ade80" : "#f87171" }]}>
                    {stats.revenueGrowth >= 0 ? "+" : ""}{stats.revenueGrowth}% vs mois dernier
                  </Text>
                </LinearGradient>
                <LinearGradient colors={["#047857", "#064e3b"]} style={[styles.revenueCard, { padding: 12 }]}>
                  <Text style={styles.revenueLabel}>Aujourd'hui</Text>
                  <Text style={[styles.revenueValue, { fontSize: 17 }]}>{stats.todayRevenue.toFixed(0)} TND</Text>
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* 7-day chart */}
          <View style={styles.section}>
            <SectionHeader title="Revenus 7 derniers jours" />
            <View style={styles.chartCard}>
              <View style={styles.chartBars}>
                {stats.dailyRevenue.map((d) => (
                  <View key={d.date} style={styles.chartBarCol}>
                    <SparkBar value={d.revenue} max={maxRevenue} color="#7c3aed" />
                    <Text style={styles.chartLabel}>{d.date.split(" ")[0]}</Text>
                    {d.revenue > 0 && <Text style={styles.chartValue}>{d.revenue.toFixed(0)}</Text>}
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* KPI grid */}
          <View style={styles.section}>
            <SectionHeader title="Indicateurs clés" />
            <View style={styles.kpiGrid}>
              <KPICard icon="bag-handle-outline" label="Commandes payées" value={String(stats.paidOrdersCount)} sub={`${stats.deliveredOrders} livrées`} color="#8b5cf6" onPress={() => router.push("/admin/orders")} />
              <KPICard icon="time-outline" label="En attente" value={String(stats.pendingOrders)} sub={stats.pendingOrders > 0 ? "À traiter" : "Tout traité ✓"} positive={stats.pendingOrders === 0} color="#f59e0b" onPress={() => router.push("/admin/orders")} />
              <KPICard icon="document-text-outline" label="À vérifier" value={String(stats.awaitingVerification)} sub="Justificatifs" positive={stats.awaitingVerification === 0} color="#ef4444" onPress={() => router.push("/admin/orders")} />
              <KPICard icon="people-outline" label="Clients" value={String(stats.totalUsers)} sub={`+${stats.newUsersMonth} ce mois`} positive color="#06b6d4" />
              <KPICard icon="cart-outline" label="Panier moyen" value={`${stats.avgOrderValue.toFixed(1)} TND`} color="#10b981" />
              <KPICard icon="chatbubbles-outline" label="Tickets ouverts" value={String(stats.openTickets)} color="#f59e0b" onPress={() => router.push("/support")} />
            </View>
          </View>

          {/* Payment method breakdown */}
          {stats.methodBreakdown.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Méthodes de paiement" />
              <View style={styles.card}>
                {stats.methodBreakdown.sort((a, b) => b.count - a.count).map((m) => {
                  const total = stats.methodBreakdown.reduce((s, x) => s + x.count, 0);
                  const pct = total > 0 ? Math.round((m.count / total) * 100) : 0;
                  return (
                    <View key={m.method} style={styles.methodRow}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                          <Text style={styles.methodLabel}>{METHOD_LABEL[m.method] ?? m.method}</Text>
                          <Text style={styles.methodPct}>{pct}% · {m.count}</Text>
                        </View>
                        <View style={styles.methodBarBg}>
                          <View style={[styles.methodBarFill, { width: `${pct}%` as any }]} />
                        </View>
                        <Text style={styles.methodRevenue}>{m.revenue.toFixed(2)} TND</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Recent orders */}
          <View style={styles.section}>
            <SectionHeader title="Commandes récentes" action="Voir tout" onAction={() => router.push("/admin/orders")} />
            <View style={styles.card}>
              {stats.recentOrders.map((order, idx) => {
                const color = STATUS_COLORS[order.status] ?? "#6b7280";
                const isAwaiting = order.paymentStatus === "awaiting_verification";
                return (
                  <TouchableOpacity
                    key={order.id}
                    onPress={() => router.push("/admin/orders")}
                    style={[styles.orderRow, idx < stats.recentOrders.length - 1 && styles.orderRowBorder]}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={styles.orderNum}>#{order.orderNumber}</Text>
                        {isAwaiting && (
                          <View style={styles.awaitingBadge}>
                            <Text style={styles.awaitingBadgeText}>À vérifier</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.orderCustomer} numberOfLines={1}>{order.customerEmail}</Text>
                      <Text style={styles.orderProducts} numberOfLines={1}>{order.products}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 4 }}>
                      <Text style={styles.orderAmount}>{order.totalAmount.toFixed(2)} TND</Text>
                      <View style={[styles.statusChip, { backgroundColor: color + "20" }]}>
                        <Text style={[styles.statusText, { color }]}>{STATUS_LABELS[order.status] ?? order.status}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Low stock */}
          {stats.lowStock.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Alertes stock" action="Gérer" onAction={() => router.push("/admin/products")} />
              <View style={styles.card}>
                {stats.lowStock.map((p, idx) => (
                  <View key={p.id} style={[styles.stockRow, idx < stats.lowStock.length - 1 && styles.orderRowBorder]}>
                    <Text style={styles.stockName} numberOfLines={1}>{p.name}</Text>
                    <View style={[styles.stockBadge, { backgroundColor: p.stock === 0 ? "#450a0a" : "#451a03" }]}>
                      <Text style={[styles.stockBadgeText, { color: p.stock === 0 ? "#f87171" : "#fbbf24" }]}>
                        {p.stock === 0 ? "Rupture" : `${p.stock} dispo.`}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Quick nav */}
          <View style={styles.section}>
            <SectionHeader title="Accès rapide" />
            <View style={{ gap: 8 }}>
              <NavCard icon="list-outline" title="Commandes" subtitle={`${stats.pendingOrders} en attente · ${stats.awaitingVerification} à vérifier`} color="#8b5cf6" badge={stats.pendingOrders + stats.awaitingVerification} onPress={() => router.push("/admin/orders")} />
              <NavCard icon="cube-outline" title="Produits" subtitle={`${stats.totalProducts} produits actifs`} color="#10b981" onPress={() => router.push("/admin/products")} />
              <NavCard icon="chatbubbles-outline" title="Support" subtitle={`${stats.openTickets} tickets ouverts`} color="#f59e0b" badge={stats.openTickets} onPress={() => router.push("/support")} />
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d14" },
  center: { flex: 1, backgroundColor: "#0d0d14", alignItems: "center", justifyContent: "center", gap: 16 },
  errorText: { color: "#9ca3af", fontSize: 15, textAlign: "center" },
  backBtn: { marginTop: 8, backgroundColor: "#1a0533", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  backBtnText: { color: "#a78bfa", fontWeight: "600" },

  header: { paddingHorizontal: 16, paddingBottom: 20, flexDirection: "row", alignItems: "center", gap: 12 },
  backIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#1a0533", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 19, fontWeight: "800" },
  headerSub: { color: "#6b7280", fontSize: 11, marginTop: 2 },
  adminBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#2e1065", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: "#4c1d95" },
  adminBadgeText: { color: "#a78bfa", fontSize: 11, fontWeight: "700" },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 16 },
  loadingText: { color: "#6b7280", fontSize: 14 },

  alerts: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  alertAmber: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#451a03", borderWidth: 1, borderColor: "#92400e", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  alertAmberText: { color: "#fbbf24", fontSize: 13, fontWeight: "600" },
  alertRed: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#450a0a", borderWidth: 1, borderColor: "#7f1d1d", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  alertRedText: { color: "#f87171", fontSize: 13, fontWeight: "600" },

  section: { paddingHorizontal: 16, paddingTop: 22, gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  sectionAction: { color: "#a78bfa", fontSize: 13 },

  // Revenue
  revenueRow: { flexDirection: "row", gap: 10 },
  revenueCard: { flex: 1, borderRadius: 16, padding: 16, gap: 4 },
  revenueLabel: { color: "rgba(255,255,255,0.65)", fontSize: 12 },
  revenueValue: { color: "#fff", fontSize: 22, fontWeight: "900" },
  revenueSub: { color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 2 },

  // Chart
  chartCard: { backgroundColor: "#12121f", borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: "#2d2d4e", padding: 16 },
  chartBars: { flexDirection: "row", alignItems: "flex-end", height: 80, gap: 6 },
  chartBarCol: { flex: 1, alignItems: "center", gap: 4, height: "100%" },
  sparkBarWrap: { flex: 1, width: "100%", justifyContent: "flex-end" },
  sparkBarFill: { width: "100%", borderRadius: 4, minHeight: 4 },
  chartLabel: { color: "#4b5563", fontSize: 9, textAlign: "center" },
  chartValue: { color: "#a78bfa", fontSize: 8, fontWeight: "700", textAlign: "center" },

  // KPIs
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  kpiCard: { width: (width - 48) / 3, backgroundColor: "#12121f", borderRadius: 14, borderWidth: 1, padding: 12, gap: 4 },
  kpiIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  kpiValue: { color: "#fff", fontSize: 18, fontWeight: "800" },
  kpiLabel: { color: "#6b7280", fontSize: 10, lineHeight: 14 },
  kpiSub: { fontSize: 10, fontWeight: "600" },

  // Methods
  card: { backgroundColor: "#12121f", borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: "#2d2d4e", padding: 14, gap: 12 },
  methodRow: { gap: 4 },
  methodLabel: { color: "#e5e7eb", fontSize: 13, fontWeight: "600" },
  methodPct: { color: "#6b7280", fontSize: 12 },
  methodBarBg: { height: 4, backgroundColor: "#1f1f35", borderRadius: 2, overflow: "hidden" },
  methodBarFill: { height: 4, backgroundColor: "#7c3aed", borderRadius: 2 },
  methodRevenue: { color: "#4b5563", fontSize: 11, marginTop: 2 },

  // Recent orders
  orderRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 10 },
  orderRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#2d2d4e" },
  orderNum: { color: "#e5e7eb", fontSize: 13, fontWeight: "700", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  orderCustomer: { color: "#6b7280", fontSize: 11, marginTop: 1 },
  orderProducts: { color: "#4b5563", fontSize: 11, marginTop: 1 },
  orderAmount: { color: "#a78bfa", fontSize: 14, fontWeight: "800" },
  statusChip: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: "700" },
  awaitingBadge: { backgroundColor: "#451a03", borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  awaitingBadgeText: { color: "#fbbf24", fontSize: 9, fontWeight: "700" },

  // Low stock
  stockRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  stockName: { color: "#e5e7eb", fontSize: 13, flex: 1, marginRight: 10 },
  stockBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  stockBadgeText: { fontSize: 12, fontWeight: "700" },

  // Nav
  navCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#12121f", borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: "#2d2d4e", padding: 14 },
  navIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  navTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },
  navSub: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  navBadge: { backgroundColor: "#dc2626", borderRadius: 10, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  navBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
