import React from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/utils/format";
import { Button } from "@/components/ui/Button";
import type { CartItem } from "@/types";

function CartRow({ item }: { item: CartItem }) {
  const { remove, updateQuantity } = useCartStore();

  const price = item.variantPrice !== undefined
    ? item.variantPrice
    : item.variant === "account"
    ? (item.product.accountDiscountPrice ?? item.product.accountPrice ?? item.product.price)
    : (item.product.discountPrice ?? item.product.price);

  const originalPrice = item.variant === "account"
    ? (item.product.accountPrice ?? item.product.price)
    : item.product.price;

  const hasDiscount = price < originalPrice;

  return (
    <View style={styles.cartRow}>
      {/* Thumbnail */}
      <View style={styles.thumbWrap}>
        {item.product.imageUrl ? (
          <Image
            source={{ uri: item.product.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <LinearGradient colors={["#2d1b4e", "#1a1a2e"]} style={StyleSheet.absoluteFill}>
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 26 }}>🎮</Text>
            </View>
          </LinearGradient>
        )}
      </View>

      {/* Info */}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.product.name}</Text>

        {/* Platform + variant badges */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 3 }}>
          <Text style={styles.platformBadge}>{item.product.platform}</Text>
          {item.variant && (
            <View style={[styles.variantBadge, { backgroundColor: item.variant === "key" ? "#2d1b4e" : "#1e2a4e", borderColor: item.variant === "key" ? "#6d28d9" : "#3b5bdb" }]}>
              <Text style={{ color: item.variant === "key" ? "#c4b5fd" : "#93c5fd", fontSize: 10, fontWeight: "700" }}>
                {item.variant === "key" ? "🔑 Clé" : "👤 Compte"}
              </Text>
            </View>
          )}
          {item.variantName && (
            <View style={styles.variantNameBadge}>
              <Text style={styles.variantNameText}>{item.variantName}</Text>
            </View>
          )}
        </View>

        {/* Qty + price */}
        <View style={styles.bottomRow}>
          {/* Qty control */}
          <View style={styles.qtyControl}>
            <TouchableOpacity
              onPress={() => updateQuantity(item.product.id, item.quantity - 1, item.variant)}
              style={styles.qtyBtn}
              hitSlop={6}
            >
              <Ionicons name="remove" size={13} color="#e5e7eb" />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity
              onPress={() => updateQuantity(item.product.id, item.quantity + 1, item.variant)}
              style={styles.qtyBtn}
              hitSlop={6}
            >
              <Ionicons name="add" size={13} color="#e5e7eb" />
            </TouchableOpacity>
          </View>

          {/* Price */}
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.itemPrice}>{formatPrice(price * item.quantity)}</Text>
            {hasDiscount && item.quantity > 1 && (
              <Text style={styles.unitPrice}>{formatPrice(price)} / u.</Text>
            )}
          </View>
        </View>
      </View>

      {/* Delete */}
      <TouchableOpacity
        onPress={() => remove(item.product.id, item.variant)}
        style={styles.deleteBtn}
        hitSlop={10}
      >
        <Ionicons name="trash-outline" size={17} color="#6b7280" />
      </TouchableOpacity>
    </View>
  );
}

function TrustBadges() {
  const badges = [
    { icon: "shield-checkmark-outline" as const, text: "Sécurisé" },
    { icon: "flash-outline" as const, text: "1h–24h" },
    { icon: "lock-closed-outline" as const, text: "Chiffré" },
  ];
  return (
    <View style={styles.trustRow}>
      {badges.map(({ icon, text }) => (
        <View key={text} style={styles.trustItem}>
          <Ionicons name={icon} size={13} color="#4ade80" />
          <Text style={styles.trustText}>{text}</Text>
        </View>
      ))}
    </View>
  );
}

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, total, clear } = useCartStore();

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = total();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={styles.headerIcon}>
            <Ionicons name="cart" size={18} color="#a78bfa" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Mon Panier</Text>
            {items.length > 0 && (
              <Text style={styles.headerSub}>{itemCount} article{itemCount > 1 ? "s" : ""}</Text>
            )}
          </View>
        </View>
        {items.length > 0 && (
          <TouchableOpacity onPress={clear} style={styles.clearBtn} hitSlop={8}>
            <Text style={styles.clearText}>Vider</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cart-outline" size={40} color="#374151" />
          </View>
          <Text style={styles.emptyTitle}>Votre panier est vide</Text>
          <Text style={styles.emptyDesc}>Découvrez notre sélection de jeux et cartes prépayées</Text>
          <Button
            title="Explorer la boutique"
            onPress={() => router.push("/(tabs)/products")}
            style={{ marginTop: 16 }}
          />
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(i) => `${i.product.id}:${i.variant ?? ""}:${i.variantId ?? ""}`}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 200 }]}
            renderItem={({ item }) => <CartRow item={item} />}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={<TrustBadges />}
          />

          {/* Sticky bottom summary */}
          <View style={[styles.summary, { paddingBottom: insets.bottom + 90 }]}>
            {/* Rows */}
            <View style={styles.summaryLines}>
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLineLabel}>Sous-total</Text>
                <Text style={styles.summaryLineValue}>{formatPrice(subtotal)}</Text>
              </View>
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLineLabel}>Livraison</Text>
                <Text style={[styles.summaryLineValue, { color: "#4ade80" }]}>Gratuite</Text>
              </View>
              <View style={[styles.summaryLine, styles.totalLine]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>{formatPrice(subtotal)}</Text>
              </View>
            </View>
            <Button
              title="Commander maintenant"
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

  // Header
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
  headerIcon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "#1a0533",
    borderWidth: 1, borderColor: "#4c1d95",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerSub: { color: "#6b7280", fontSize: 12, marginTop: 1 },
  clearBtn: { paddingVertical: 6, paddingHorizontal: 10 },
  clearText: { color: "#f87171", fontSize: 13, fontWeight: "600" },

  // Empty
  emptyContainer: {
    flex: 1, alignItems: "center", justifyContent: "center", padding: 32,
  },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: "#12121f", borderWidth: 1, borderColor: "#2d2d4e",
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  emptyTitle: { color: "#fff", fontSize: 20, fontWeight: "800", textAlign: "center" },
  emptyDesc: { color: "#6b7280", fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 },

  // List
  list: { padding: 16, gap: 10 },

  // Cart row
  cartRow: {
    flexDirection: "row",
    backgroundColor: "#12121f",
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#2d2d4e",
    padding: 12,
    gap: 12,
    alignItems: "flex-start",
  },
  thumbWrap: {
    width: 72, height: 72, borderRadius: 14,
    backgroundColor: "#1a1a2e",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#2d2d4e",
    flexShrink: 0,
  },
  productInfo: { flex: 1, gap: 0 },
  productName: { color: "#f9fafb", fontSize: 13, fontWeight: "700", lineHeight: 18 },
  platformBadge: { color: "#6b7280", fontSize: 11 },
  variantBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1 },
  variantNameBadge: { backgroundColor: "#1a1a2e", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: "#2d2d4e" },
  variantNameText: { color: "#9ca3af", fontSize: 10, fontWeight: "600" },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  qtyControl: {
    flexDirection: "row", alignItems: "center", gap: 0,
    backgroundColor: "#1a1a2e", borderRadius: 12,
    borderWidth: 1, borderColor: "#2d2d4e",
    overflow: "hidden",
  },
  qtyBtn: {
    width: 30, height: 30,
    alignItems: "center", justifyContent: "center",
  },
  qtyText: { color: "#fff", fontWeight: "800", fontSize: 14, minWidth: 22, textAlign: "center" },
  itemPrice: { color: "#a78bfa", fontWeight: "900", fontSize: 15 },
  unitPrice: { color: "#4b5563", fontSize: 10, marginTop: 1 },
  deleteBtn: { padding: 4, marginTop: 2 },

  // Trust badges
  trustRow: {
    flexDirection: "row", gap: 8, marginTop: 8,
  },
  trustItem: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#12121f", borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth, borderColor: "#2d2d4e",
    paddingVertical: 8, paddingHorizontal: 10,
  },
  trustText: { color: "#6b7280", fontSize: 11, fontWeight: "500" },

  // Summary
  summary: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#0d0d14",
    borderTopWidth: 1, borderTopColor: "#1f1f35",
    padding: 16, gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 25,
  },
  summaryLines: {
    backgroundColor: "#12121f", borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth, borderColor: "#2d2d4e",
    paddingHorizontal: 14, paddingVertical: 10, gap: 6,
  },
  summaryLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLineLabel: { color: "#6b7280", fontSize: 13 },
  summaryLineValue: { color: "#e5e7eb", fontSize: 13, fontWeight: "600" },
  totalLine: {
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#2d2d4e",
    paddingTop: 8, marginTop: 2,
  },
  totalLabel: { color: "#fff", fontSize: 15, fontWeight: "800" },
  totalAmount: { color: "#a78bfa", fontSize: 20, fontWeight: "900" },
});
