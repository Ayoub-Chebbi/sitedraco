import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ActionSheetIOS,
  Alert,
  StyleSheet,
  Platform,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getAdminOrders, updateOrderStatus, type AdminOrder } from "@/api/admin";

const STATUS_TABS = [
  { key: undefined, label: "Tous" },
  { key: "pending", label: "En attente" },
  { key: "processing", label: "En cours" },
  { key: "delivered", label: "Livrée" },
  { key: "cancelled", label: "Annulée" },
];

const ORDER_STATUSES = ["pending", "processing", "delivered", "cancelled", "refunded"];
const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  processing: "En cours",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  delivered: "#10b981",
  cancelled: "#ef4444",
  refunded: "#8b5cf6",
};

function OrderRow({ order, onUpdate }: { order: AdminOrder; onUpdate: (id: string) => void }) {
  const color = STATUS_COLORS[order.status] ?? "#6b7280";
  const label = STATUS_LABELS[order.status] ?? order.status;

  return (
    <TouchableOpacity onPress={() => onUpdate(order.id)} activeOpacity={0.8} style={styles.orderCard}>
      <View style={styles.orderTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <Text style={styles.orderUser}>{order.user?.name ?? order.user?.email ?? "Invité"}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: color + "22" }]}>
          <Text style={[styles.badgeText, { color }]}>{label}</Text>
        </View>
      </View>
      <View style={styles.orderBottom}>
        <Text style={styles.orderItems}>
          {order.items.map((i) => i.product.name).slice(0, 2).join(", ")}
          {order.items.length > 2 ? ` +${order.items.length - 2}` : ""}
        </Text>
        <Text style={styles.orderAmount}>{order.totalAmount.toFixed(2)} TND</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AdminOrders() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin-orders", activeStatus],
    queryFn: () => getAdminOrders({ status: activeStatus }),
    staleTime: 30_000,
  });

  const { mutate: patchOrder } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateOrderStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });

  function handleUpdate(orderId: string) {
    const actions = ORDER_STATUSES.map((s) => STATUS_LABELS[s]);

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: "Changer le statut",
          options: [...actions, "Annuler"],
          cancelButtonIndex: actions.length,
        },
        (index) => {
          if (index < ORDER_STATUSES.length) {
            patchOrder({ id: orderId, status: ORDER_STATUSES[index] });
          }
        }
      );
    } else {
      Alert.alert(
        "Changer le statut",
        "Sélectionnez le nouveau statut",
        [
          ...ORDER_STATUSES.map((s) => ({
            text: STATUS_LABELS[s],
            onPress: () => patchOrder({ id: orderId, status: s }),
          })),
          { text: "Annuler", style: "cancel" as const },
        ]
      );
    }
  }

  const orders = data?.orders ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#a78bfa" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Commandes</Text>
        <Text style={styles.headerCount}>{data?.total ?? 0}</Text>
      </View>

      {/* Status filter tabs */}
      <View style={styles.tabsWrap}>
        <FlatList
          horizontal
          data={STATUS_TABS}
          keyExtractor={(item) => item.key ?? "all"}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsList}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveStatus(item.key)}
              style={[styles.tab, activeStatus === item.key && styles.tabActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeStatus === item.key && styles.tabTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#a78bfa" />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="bag-outline" size={48} color="#374151" />
          <Text style={styles.emptyText}>Aucune commande</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#a78bfa" />
          }
          renderItem={({ item }) => (
            <OrderRow order={item} onUpdate={handleUpdate} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d14" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { color: "#6b7280", fontSize: 14 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#1a0533",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, color: "#fff", fontSize: 20, fontWeight: "800" },
  headerCount: {
    color: "#a78bfa",
    fontSize: 14,
    fontWeight: "700",
    backgroundColor: "#2e1065",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tabsWrap: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#2d2d4e" },
  tabsList: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#12121f",
    borderWidth: 1,
    borderColor: "#2d2d4e",
  },
  tabActive: { backgroundColor: "#2e1065", borderColor: "#7c3aed" },
  tabText: { color: "#9ca3af", fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#a78bfa" },
  orderCard: {
    backgroundColor: "#12121f",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#2d2d4e",
    padding: 14,
    gap: 10,
  },
  orderTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  orderNumber: { color: "#fff", fontSize: 14, fontWeight: "700" },
  orderUser: { color: "#9ca3af", fontSize: 12, marginTop: 2 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  orderBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderItems: { color: "#6b7280", fontSize: 12, flex: 1, marginRight: 8 },
  orderAmount: { color: "#a78bfa", fontSize: 14, fontWeight: "700" },
});
