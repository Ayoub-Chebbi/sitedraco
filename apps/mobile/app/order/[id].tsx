import React from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getOrderByNumber } from "@/api/orders";
import { formatDate, formatPrice, statusColor, statusLabel } from "@/utils/format";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/common/EmptyState";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrderByNumber(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0d0d14" }}>
        <ScreenHeader title="Commande" showBack />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#7c3aed" size="large" />
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0d0d14" }}>
        <ScreenHeader title="Commande" showBack />
        <EmptyState emoji="❌" title="Commande introuvable" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0d0d14" }}>
      <ScreenHeader title={`#${order.orderNumber}`} showBack />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16, gap: 16 }}>

        {/* Status card */}
        <View style={{ backgroundColor: "#1a1a2e", borderRadius: 14, borderWidth: 1, borderColor: "#2d2d4e", padding: 16, gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Statut</Text>
            <Badge label={statusLabel(order.status)} color={statusColor(order.status)} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#6b7280" }}>Date</Text>
            <Text style={{ color: "#9ca3af" }}>{formatDate(order.createdAt)}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#6b7280" }}>Paiement</Text>
            <Badge label={statusLabel(order.paymentStatus)} color={statusColor(order.paymentStatus)} size="sm" />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#6b7280" }}>Méthode</Text>
            <Text style={{ color: "#9ca3af" }}>{order.paymentMethod ?? "—"}</Text>
          </View>
        </View>

        {/* Items */}
        <View style={{ backgroundColor: "#1a1a2e", borderRadius: 14, borderWidth: 1, borderColor: "#2d2d4e", padding: 16, gap: 12 }}>
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Articles commandés</Text>
          {order.items.map((item) => (
            <View key={item.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "#2d2d4e" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#e5e7eb", fontSize: 14, fontWeight: "500" }} numberOfLines={2}>{item.product.name}</Text>
                <Text style={{ color: "#6b7280", fontSize: 12 }}>x{item.quantity} · {formatPrice(item.unitPrice)}</Text>
              </View>
              <Text style={{ color: "#a78bfa", fontWeight: "700" }}>{formatPrice(item.unitPrice * item.quantity)}</Text>
            </View>
          ))}
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 4 }}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Total</Text>
            <Text style={{ color: "#a78bfa", fontSize: 18, fontWeight: "900" }}>{formatPrice(order.totalAmount)}</Text>
          </View>
        </View>

        {/* Delivery notice */}
        {order.status === "delivered" && (
          <View style={{ backgroundColor: "#052e16", borderWidth: 1, borderColor: "#166534", borderRadius: 12, padding: 16, gap: 6 }}>
            <Text style={{ color: "#4ade80", fontSize: 15, fontWeight: "700" }}>✅ Commande livrée</Text>
            <Text style={{ color: "#86efac", fontSize: 13 }}>Vos clés ont été envoyées à votre email.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
