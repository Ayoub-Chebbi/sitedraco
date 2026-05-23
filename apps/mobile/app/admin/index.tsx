import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getAdminStats, type AdminStats } from "@/api/admin";
import { useAuthStore } from "@/store/auth";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  accent,
}: {
  icon: IoniconName;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  accent: string;
}) {
  return (
    <View style={[styles.statCard, { borderColor: color + "33" }]}>
      <View style={[styles.statIconWrap, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub && <Text style={[styles.statSub, { color: accent }]}>{sub}</Text>}
    </View>
  );
}

function NavCard({
  icon,
  title,
  subtitle,
  onPress,
  color,
  badge,
}: {
  icon: IoniconName;
  title: string;
  subtitle: string;
  onPress: () => void;
  color: string;
  badge?: number;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.navCard}>
      <LinearGradient colors={[color + "22", color + "08"]} style={styles.navCardGradient}>
        <View style={[styles.navIconWrap, { backgroundColor: color + "33" }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.navTitle}>{title}</Text>
          <Text style={styles.navSub}>{subtitle}</Text>
        </View>
        {badge !== undefined && badge > 0 && (
          <View style={styles.navBadge}>
            <Text style={styles.navBadgeText}>{badge}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color="#4b5563" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor="#a78bfa"
          colors={["#a78bfa"]}
        />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={["#1e1035", "#0d0d14"]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={22} color="#a78bfa" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Dashboard Admin</Text>
          <Text style={styles.headerSub}>Vue d'ensemble de la plateforme</Text>
        </View>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={12} color="#a78bfa" />
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#a78bfa" />
          <Text style={styles.loadingText}>Chargement des statistiques…</Text>
        </View>
      ) : (
        <>
          {/* Revenue section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Revenus</Text>
            <View style={styles.revenueRow}>
              <View style={[styles.revenueCard, { flex: 1 }]}>
                <LinearGradient colors={["#7c3aed", "#4c1d95"]} style={styles.revenueGradient}>
                  <Text style={styles.revenueLabel}>Total</Text>
                  <Text style={styles.revenueValue}>
                    {(stats?.totalRevenue ?? 0).toFixed(0)} TND
                  </Text>
                </LinearGradient>
              </View>
              <View style={[styles.revenueCard, { flex: 1 }]}>
                <LinearGradient colors={["#0e7490", "#164e63"]} style={styles.revenueGradient}>
                  <Text style={styles.revenueLabel}>Ce mois</Text>
                  <Text style={styles.revenueValue}>
                    {(stats?.monthRevenue ?? 0).toFixed(0)} TND
                  </Text>
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* Stats grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistiques</Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon="bag-handle-outline"
                label="Commandes"
                value={stats?.totalOrders ?? 0}
                sub={`+${stats?.monthOrders ?? 0} ce mois`}
                color="#8b5cf6"
                accent="#a78bfa"
              />
              <StatCard
                icon="people-outline"
                label="Utilisateurs"
                value={stats?.totalUsers ?? 0}
                sub={`+${stats?.newUsersMonth ?? 0} ce mois`}
                color="#06b6d4"
                accent="#67e8f9"
              />
              <StatCard
                icon="cube-outline"
                label="Produits"
                value={stats?.totalProducts ?? 0}
                color="#10b981"
                accent="#6ee7b7"
              />
              <StatCard
                icon="chatbubbles-outline"
                label="Tickets ouverts"
                value={stats?.openTickets ?? 0}
                color="#f59e0b"
                accent="#fcd34d"
              />
            </View>
          </View>

          {/* Quick actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accès rapide</Text>
            <View style={{ gap: 10 }}>
              <NavCard
                icon="list-outline"
                title="Commandes"
                subtitle={`${stats?.pendingOrders ?? 0} en attente`}
                color="#8b5cf6"
                badge={stats?.pendingOrders}
                onPress={() => router.push("/admin/orders")}
              />
              <NavCard
                icon="cube-outline"
                title="Produits"
                subtitle={`${stats?.totalProducts ?? 0} produits`}
                color="#10b981"
                onPress={() => router.push("/admin/products")}
              />
              <NavCard
                icon="chatbubbles-outline"
                title="Support"
                subtitle={`${stats?.openTickets ?? 0} tickets ouverts`}
                color="#f59e0b"
                badge={stats?.openTickets}
                onPress={() => router.push("/support")}
              />

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
  backBtn: {
    marginTop: 8,
    backgroundColor: "#1a0533",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtnText: { color: "#a78bfa", fontWeight: "600" },
  header: { paddingHorizontal: 16, paddingBottom: 20, flexDirection: "row", alignItems: "center", gap: 12 },
  backIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#1a0533",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  headerSub: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2e1065",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#4c1d95",
  },
  adminBadgeText: { color: "#a78bfa", fontSize: 11, fontWeight: "700" },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 16 },
  loadingText: { color: "#6b7280", fontSize: 14 },
  section: { paddingHorizontal: 16, paddingTop: 24, gap: 12 },
  sectionTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: "47.5%",
    backgroundColor: "#12121f",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  statIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statValue: { color: "#fff", fontSize: 24, fontWeight: "800" },
  statLabel: { color: "#9ca3af", fontSize: 12, fontWeight: "500" },
  statSub: { fontSize: 11, fontWeight: "600" },
  revenueRow: { flexDirection: "row", gap: 10 },
  revenueCard: { borderRadius: 16, overflow: "hidden" },
  revenueGradient: { padding: 20, gap: 4 },
  revenueLabel: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "500" },
  revenueValue: { color: "#fff", fontSize: 22, fontWeight: "800" },
  navCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#2d2d4e",
  },
  navCardGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
  },
  navIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  navTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  navSub: { color: "#9ca3af", fontSize: 12, marginTop: 2 },
  navBadge: {
    backgroundColor: "#dc2626",
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  navBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
