import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getProducts } from "@/api/products";
import { ProductCard } from "@/components/product/ProductCard";
import { EmptyState } from "@/components/common/EmptyState";

const PLATFORMS = ["Tous", "PlayStation", "Xbox", "PC", "Nintendo", "Mobile", "Gift Cards"];

const SORTS = [
  { label: "Nouveautés", value: "newest" },
  { label: "Prix ↑", value: "price_asc" },
  { label: "Prix ↓", value: "price_desc" },
  { label: "Populaires", value: "popular" },
];

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ platform?: string }>();
  const [platform, setPlatform] = useState(params.platform ?? "Tous");
  const [sort, setSort] = useState("newest");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["products", platform, sort, search],
    queryFn: () =>
      getProducts({
        platform: platform === "Tous" ? undefined : platform,
        sort,
        search: search || undefined,
        limit: 40,
      }),
    staleTime: 30_000,
  });

  const handleSearch = useCallback(() => setSearch(searchInput), [searchInput]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Boutique</Text>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={16} color="#6b7280" style={{ marginLeft: 12 }} />
            <TextInput
              value={searchInput}
              onChangeText={setSearchInput}
              onSubmitEditing={handleSearch}
              placeholder="Rechercher un jeu…"
              placeholderTextColor="#4b5563"
              style={styles.searchInput}
              returnKeyType="search"
            />
            {searchInput.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchInput(""); setSearch(""); }} style={{ marginRight: 10 }}>
                <Ionicons name="close-circle" size={16} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={handleSearch} style={styles.searchBtn}>
            <Ionicons name="search" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Platforms */}
        <FlatList
          data={PLATFORMS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(p) => p}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setPlatform(item)}
              style={[styles.chip, platform === item && styles.chipActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, platform === item && styles.chipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Sorts */}
        <FlatList
          data={SORTS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(s) => s.value}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSort(item.value)}
              style={[styles.sortChip, sort === item.value && styles.sortChipActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.sortText, sort === item.value && styles.sortTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Grid */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#7c3aed" size="large" />
          <Text style={styles.loadingText}>Chargement des produits…</Text>
        </View>
      ) : (
        <FlatList
          data={data?.products ?? []}
          numColumns={2}
          keyExtractor={(p) => p.id}
          contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 90 }]}
          columnWrapperStyle={styles.row}
          ListEmptyComponent={
            <EmptyState
              emoji="🔍"
              title="Aucun produit trouvé"
              description="Essayez de modifier vos filtres ou votre recherche"
            />
          }
          ListHeaderComponent={
            isFetching && !isLoading ? (
              <ActivityIndicator color="#7c3aed" size="small" style={{ marginBottom: 8 }} />
            ) : null
          }
          renderItem={({ item }) => <ProductCard product={item} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d14" },
  header: {
    backgroundColor: "#0d0d14",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2d2d4e",
  },
  headerTitle: { color: "#fff", fontSize: 26, fontWeight: "800" },
  searchRow: { flexDirection: "row", gap: 10 },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#12121f",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#2d2d4e",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    color: "#f9fafb",
    fontSize: 14,
  },
  searchBtn: {
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#12121f",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#2d2d4e",
  },
  chipActive: {
    backgroundColor: "#4c1d95",
    borderColor: "#7c3aed",
  },
  chipText: { color: "#9ca3af", fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  sortChipActive: {
    backgroundColor: "#1a0533",
    borderWidth: 1,
    borderColor: "#7c3aed",
  },
  sortText: { color: "#6b7280", fontSize: 12, fontWeight: "500" },
  sortTextActive: { color: "#a78bfa", fontWeight: "700" },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: "#9ca3af", fontSize: 14 },
  grid: { padding: 16, gap: 12 },
  row: { gap: 12 },
});
