import React from "react";
import { View, FlatList, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getMyOrders } from "@/api/orders";
import { formatDate, formatPrice, statusColor, statusLabel } from "@/utils/format";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/Button";

export default function OrderListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: orders, isLoading } = useQuery({ queryKey: ["my-orders"], queryFn: getMyOrders });

  return (
    <View style={{ flex: 1, backgroundColor: "#0d0d14" }}>
      <ScreenHeader title="Mes commandes" showBack />
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#7c3aed" size="large" />
        </View>
      ) : (
        <FlatList
          data={orders ?? []}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16, gap: 10, flexGrow: 1 }}
          ListEmptyComponent={
            <EmptyState
              emoji="📦"
              title="Aucune commande"
              description="Vos commandes apparaîtront ici"
              action={<Button title="Explorer la boutique" onPress={() => router.push("/(tabs)/products")} />}
            />
          }
          renderItem={({ item: order }) => (
            <TouchableOpacity
              onPress={() => router.push(`/order/${order.orderNumber}`)}
              style={{ backgroundColor: "#1a1a2e", borderWidth: 1, borderColor: "#2d2d4e", borderRadius: 14, padding: 16, gap: 10 }}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>#{order.orderNumber}</Text>
                <Badge label={statusLabel(order.status)} color={statusColor(order.status)} />
              </View>
              <Text style={{ color: "#6b7280", fontSize: 12 }}>{formatDate(order.createdAt)}</Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: "#9ca3af", fontSize: 13 }}>{order.items.length} article(s)</Text>
                <Text style={{ color: "#a78bfa", fontWeight: "800", fontSize: 16 }}>{formatPrice(order.totalAmount)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
