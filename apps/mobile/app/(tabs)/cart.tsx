import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/utils/format";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/Button";
import type { CartItem } from "@/types";

function CartRow({ item }: { item: CartItem }) {
  const { remove, updateQuantity } = useCartStore();
  const price = item.variant === "account"
    ? (item.product.accountDiscountPrice ?? item.product.accountPrice ?? item.product.price)
    : (item.product.discountPrice ?? item.product.price);

  return (
    <View style={styles.cartRow}>
      <View style={styles.productThumb}>
        <Text style={{ fontSize: 26 }}>🎮</Text>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.product.name}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={styles.productPlatform}>{item.product.platform}</Text>
          {item.variant && (
            <View style={{ backgroundColor: item.variant === "key" ? "#2d1b4e" : "#1e2a4e", borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 }}>
              <Text style={{ color: item.variant === "key" ? "#c4b5fd" : "#93c5fd", fontSize: 10, fontWeight: "700" }}>
                {item.variant === "key" ? "🔑 Clé" : "👤 Compte"}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.qtyRow}>
          <TouchableOpacity
            onPress={() => updateQuantity(item.product.id, item.quantity - 1, item.variant)}
            style={styles.qtyBtn}
          >
            <Ionicons name="remove" size={14} color="#e5e7eb" />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => updateQuantity(item.product.id, item.quantity + 1, item.variant)}
            style={styles.qtyBtn}
          >
            <Ionicons name="add" size={14} color="#e5e7eb" />
          </TouchableOpacity>
          <Text style={styles.itemPrice}>{formatPrice(price * item.quantity)}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => remove(item.product.id, item.variant)}
        style={styles.deleteBtn}
        hitSlop={8}
      >
        <Ionicons name="trash-outline" size={18} color="#f87171" />
      </TouchableOpacity>
    </View>
  );
}

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, total, clear } = useCartStore();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Mon Panier</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={clear} style={styles.clearBtn}>
            <Text style={styles.clearText}>Vider</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <EmptyState
          emoji="🛒"
          title="Votre panier est vide"
          description="Découvrez notre sélection de jeux et cartes prépayées"
          action={
            <Button
              title="Explorer la boutique"
              onPress={() => router.push("/(tabs)/products")}
            />
          }
        />
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(i) => `${i.product.id}:${i.variant ?? ""}`}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 160 }]}
            renderItem={({ item }) => <CartRow item={item} />}
            showsVerticalScrollIndicator={false}
          />

          {/* Sticky bottom summary */}
          <View style={[styles.summary, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>Total</Text>
                <Text style={styles.summaryCount}>
                  {items.reduce((s, i) => s + i.quantity, 0)} article(s)
                </Text>
              </View>
              <Text style={styles.summaryTotal}>{formatPrice(total())}</Text>
            </View>
            <Button
              title="Passer la commande"
              onPress={() => router.push("/checkout")}
              fullWidth
              size="lg"
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d14" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#0d0d14",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2d2d4e",
  },
  headerTitle: { color: "#fff", fontSize: 26, fontWeight: "800" },
  clearBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  clearText: { color: "#f87171", fontSize: 13, fontWeight: "600" },
  list: { padding: 16, gap: 12 },
  cartRow: {
    flexDirection: "row",
    backgroundColor: "#12121f",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#2d2d4e",
    padding: 14,
    gap: 12,
    alignItems: "flex-start",
  },
  productThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: { flex: 1, gap: 4 },
  productName: { color: "#f9fafb", fontSize: 14, fontWeight: "600", lineHeight: 20 },
  productPlatform: { color: "#6b7280", fontSize: 12 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#2d2d4e",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: { color: "#fff", fontWeight: "700", fontSize: 15, minWidth: 20, textAlign: "center" },
  itemPrice: { color: "#a78bfa", fontWeight: "700", fontSize: 14, marginLeft: "auto" },
  deleteBtn: {
    padding: 4,
    marginTop: 2,
  },
  summary: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#12121f",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#2d2d4e",
    padding: 20,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: { color: "#9ca3af", fontSize: 13 },
  summaryCount: { color: "#6b7280", fontSize: 12 },
  summaryTotal: { color: "#a78bfa", fontSize: 26, fontWeight: "900" },
});
