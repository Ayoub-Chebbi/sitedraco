import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/store/auth";
import { getMyOrders } from "@/api/orders";
import { getMyTickets } from "@/api/tickets";
import { formatDate, statusColor, statusLabel } from "@/utils/format";
import { Button } from "@/components/ui/Button";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

function MenuItem({
  icon,
  label,
  sublabel,
  onPress,
  danger,
  badge,
}: {
  icon: IoniconName;
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
  badge?: number;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.menuItem} activeOpacity={0.7}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon} size={18} color={danger ? "#f87171" : "#a78bfa"} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, danger && { color: "#f87171" }]}>{label}</Text>
        {sublabel && <Text style={styles.menuSub}>{sublabel}</Text>}
      </View>
      {badge !== undefined && badge > 0 && (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{badge}</Text>
        </View>
      )}
      {!danger && <Ionicons name="chevron-forward" size={16} color="#4b5563" />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuthStore();

  const { data: orders } = useQuery({
    queryKey: ["my-orders"],
    queryFn: getMyOrders,
    enabled: !!user,
    staleTime: 30_000,
  });

  const { data: tickets } = useQuery({
    queryKey: ["my-tickets"],
    queryFn: getMyTickets,
    enabled: !!user,
    staleTime: 30_000,
  });

  const openTickets = tickets?.filter((t) => t.status === "open" || t.status === "in_progress").length ?? 0;

  function handleSignOut() {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Déconnecter", style: "destructive", onPress: () => signOut() },
    ]);
  }

  if (!user) {
    return (
      <View style={[styles.guestContainer, { paddingTop: insets.top }]}>
        <LinearGradient colors={["#2e1065", "#0d0d14"]} style={StyleSheet.absoluteFill} />
        <View style={styles.guestContent}>
          <View style={styles.guestIconWrap}>
            <Ionicons name="person-circle-outline" size={80} color="#4b5563" />
          </View>
          <Text style={styles.guestTitle}>Bienvenue !</Text>
          <Text style={styles.guestSub}>
            Connectez-vous pour accéder à vos commandes, tickets et profil.
          </Text>
          <Button title="Se connecter" onPress={() => router.push("/(auth)/login")} fullWidth size="lg" />
          <Button title="Créer un compte" variant="outline" onPress={() => router.push("/(auth)/register")} fullWidth />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile header */}
      <LinearGradient
        colors={["#2e1065", "#0d0d14"]}
        style={[styles.profileHeader, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.avatarRow}>
          <LinearGradient colors={["#7c3aed", "#db2777"]} style={styles.avatar}>
            <Text style={styles.avatarLetter}>
              {(user.name ?? user.email)[0].toUpperCase()}
            </Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{user.name ?? "Utilisateur"}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>
          {(user.role === "admin" || user.role === "support") && (
            <View style={styles.roleBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#a78bfa" />
              <Text style={styles.roleText}>
                {user.role === "admin" ? "Admin" : "Support"}
              </Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{orders?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Commandes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{tickets?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Tickets</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#4ade80" }]}>
              {orders?.filter((o) => o.status === "delivered").length ?? 0}
            </Text>
            <Text style={styles.statLabel}>Livrées</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Recent orders */}
      {(orders?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dernières commandes</Text>
            <TouchableOpacity onPress={() => router.push("/order/list")}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          {orders!.slice(0, 3).map((order) => (
            <TouchableOpacity
              key={order.id}
              onPress={() => router.push(`/order/${order.orderNumber}`)}
              style={styles.orderRow}
              activeOpacity={0.8}
            >
              <View style={styles.orderIconWrap}>
                <Ionicons name="bag-handle-outline" size={18} color="#a78bfa" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(order.status) + "22" }]}>
                  <Text style={[styles.statusText, { color: statusColor(order.status) }]}>
                    {statusLabel(order.status)}
                  </Text>
                </View>
                <Text style={styles.orderAmount}>{order.totalAmount.toFixed(2)} TND</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Menu */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mon compte</Text>
        <View style={styles.menuCard}>
          <MenuItem icon="bag-handle-outline" label="Mes commandes" sublabel={`${orders?.length ?? 0} commande(s)`} onPress={() => router.push("/order/list")} />
          <View style={styles.menuSeparator} />
          <MenuItem icon="chatbubbles-outline" label="Support & tickets" sublabel="Contacter l'équipe" onPress={() => router.push("/ticket/list")} badge={openTickets} />
          <View style={styles.menuSeparator} />
          <MenuItem icon="key-outline" label="Changer mon mot de passe" onPress={() => router.push("/(auth)/forgot-password")} />
          {user.role === "admin" && (
            <>
              <View style={styles.menuSeparator} />
              <MenuItem
                icon="shield-outline"
                label="Dashboard Admin"
                sublabel="Commandes, produits, stats"
                onPress={() => router.push("/admin")}
              />
            </>
          )}
          {(user.role === "admin" || user.role === "support") && (
            <>
              <View style={styles.menuSeparator} />
              <MenuItem
                icon="headset-outline"
                label="Support Dashboard"
                sublabel="Gérer les tickets clients"
                onPress={() => router.push("/support")}
              />
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.menuCard}>
          <MenuItem icon="log-out-outline" label="Se déconnecter" onPress={handleSignOut} danger />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d14" },
  guestContainer: { flex: 1, backgroundColor: "#0d0d14" },
  guestContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  guestIconWrap: { marginBottom: 8 },
  guestTitle: { color: "#fff", fontSize: 26, fontWeight: "800" },
  guestSub: { color: "#9ca3af", fontSize: 14, textAlign: "center", lineHeight: 22 },
  profileHeader: { paddingHorizontal: 20, paddingBottom: 24, gap: 20 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarLetter: { color: "#fff", fontSize: 24, fontWeight: "800" },
  profileName: { color: "#fff", fontSize: 18, fontWeight: "700" },
  profileEmail: { color: "#9ca3af", fontSize: 13 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2e1065",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#4c1d95",
  },
  roleText: { color: "#a78bfa", fontSize: 11, fontWeight: "700" },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  statItem: { flex: 1, alignItems: "center", paddingVertical: 14, gap: 4 },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.1)" },
  statValue: { color: "#fff", fontSize: 22, fontWeight: "800" },
  statLabel: { color: "#9ca3af", fontSize: 11, fontWeight: "500" },
  section: { paddingHorizontal: 16, paddingTop: 24, gap: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  seeAll: { color: "#a78bfa", fontSize: 13, fontWeight: "600" },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#12121f",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#2d2d4e",
    padding: 14,
    gap: 12,
  },
  orderIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1a0533",
    alignItems: "center",
    justifyContent: "center",
  },
  orderNumber: { color: "#fff", fontWeight: "600", fontSize: 14 },
  orderDate: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: "600" },
  orderAmount: { color: "#a78bfa", fontSize: 13, fontWeight: "700" },
  menuCard: {
    backgroundColor: "#12121f",
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#2d2d4e",
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#1a0533",
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconDanger: { backgroundColor: "#450a0a" },
  menuLabel: { color: "#e5e7eb", fontSize: 15, fontWeight: "500" },
  menuSub: { color: "#6b7280", fontSize: 12, marginTop: 1 },
  menuSeparator: { height: StyleSheet.hairlineWidth, backgroundColor: "#2d2d4e", marginLeft: 66 },
  menuBadge: {
    backgroundColor: "#db2777",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  menuBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
