import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getAdminProducts, type AdminProduct } from "@/api/admin";

const PLATFORM_COLORS: Record<string, string> = {
  PlayStation: "#003087",
  Xbox: "#107c10",
  PC: "#1b6ac9",
  Nintendo: "#e60012",
  Mobile: "#8b5cf6",
  "Gift Cards": "#d97706",
};

function StockIndicator({ count }: { count: number }) {
  if (count === 0) {
    return (
      <View style={[styles.stockBadge, { backgroundColor: "#450a0a" }]}>
        <Text style={[styles.stockText, { color: "#f87171" }]}>Rupture</Text>
      </View>
    );
  }
  if (count <= 5) {
    return (
      <View style={[styles.stockBadge, { backgroundColor: "#78350f" }]}>
        <Text style={[styles.stockText, { color: "#fbbf24" }]}>⚡ {count}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.stockBadge, { backgroundColor: "#052e16" }]}>
      <Text style={[styles.stockText, { color: "#4ade80" }]}>{count} dispo</Text>
    </View>
  );
}

function ProductRow({ product }: { product: AdminProduct }) {
  const platformColor = PLATFORM_COLORS[product.platform] ?? "#6b7280";

  return (
    <View style={styles.productCard}>
      <View style={[styles.platformDot, { backgroundColor: platformColor }]} />
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={styles.productName} numberOfLines={1}>
            {product.name}
          </Text>
          {!product.isActive && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveText}>Inactif</Text>
            </View>
          )}
        </View>
        <Text style={styles.productMeta}>
          {product.platform}
          {product.category ? ` · ${product.category}` : ""}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 6 }}>
        <Text style={styles.productPrice}>{product.price.toFixed(2)} TND</Text>
        <StockIndicator count={product._count.keys} />
      </View>
    </View>
  );
}

export default function AdminProducts() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin-products", page],
    queryFn: () => getAdminProducts(page),
    staleTime: 30_000,
  });

  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const hasMore = products.length < total;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#a78bfa" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Produits</Text>
        <Text style={styles.headerCount}>{total}</Text>
      </View>

      {/* Legend */}
      <View style={styles.legendWrap}>
        {Object.entries(PLATFORM_COLORS).map(([platform, color]) => (
          <View key={platform} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{platform}</Text>
          </View>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#a78bfa" />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="cube-outline" size={48} color="#374151" />
          <Text style={styles.emptyText}>Aucun produit</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#a78bfa" />
          }
          renderItem={({ item }) => <ProductRow product={item} />}
          ListFooterComponent={
            hasMore ? (
              <TouchableOpacity
                onPress={() => setPage((p) => p + 1)}
                style={styles.loadMoreBtn}
              >
                <Text style={styles.loadMoreText}>Charger plus</Text>
              </TouchableOpacity>
            ) : null
          }
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
  legendWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2d2d4e",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: "#9ca3af", fontSize: 11 },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#12121f",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#2d2d4e",
    padding: 14,
    gap: 12,
  },
  platformDot: { width: 4, height: 44, borderRadius: 2 },
  productName: { color: "#fff", fontSize: 14, fontWeight: "600", flex: 1 },
  productMeta: { color: "#6b7280", fontSize: 12 },
  productPrice: { color: "#a78bfa", fontSize: 14, fontWeight: "700" },
  stockBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  stockText: { fontSize: 11, fontWeight: "700" },
  inactiveBadge: {
    backgroundColor: "#27272a",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  inactiveText: { color: "#9ca3af", fontSize: 10, fontWeight: "600" },
  loadMoreBtn: {
    marginTop: 8,
    alignSelf: "center",
    backgroundColor: "#1a0533",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#4c1d95",
  },
  loadMoreText: { color: "#a78bfa", fontWeight: "600" },
});
