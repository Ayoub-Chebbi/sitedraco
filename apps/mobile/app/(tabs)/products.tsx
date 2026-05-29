"use client";
import React, { useState, useEffect, useRef } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { getProducts, getPlatforms } from "@/api/products";
import { ProductCard } from "@/components/product/ProductCard";
import { EmptyState } from "@/components/common/EmptyState";

const SORTS = [
  { label: "Nouveautés", value: "newest" },
  { label: "Populaires", value: "popular" },
  { label: "Prix ↑", value: "price_asc" },
  { label: "Prix ↓", value: "price_desc" },
];

const ALL_PLATFORM = { value: "", label: "Tous", emoji: "🎮" };

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const [platformValue, setPlatformValue] = useState("");
  const [sort, setSort] = useState("newest");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 280);
  const inputRef = useRef<TextInput>(null);

  // Fetch dynamic platforms from API
  const { data: platformsData } = useQuery({
    queryKey: ["platforms"],
    queryFn: getPlatforms,
    staleTime: 5 * 60_000,
  });

  const platforms = [ALL_PLATFORM, ...(platformsData ?? [])];

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["products", platformValue, sort, debouncedSearch],
    queryFn: () =>
      getProducts({
        platform: platformValue || undefined,
        sort,
        search: debouncedSearch || undefined,
        limit: 40,
      }),
    staleTime: 30_000,
  });

  const products = data?.products ?? [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>Boutique</Text>
          {data && (
            <Text style={styles.count}>{data.total} produit{data.total !== 1 ? "s" : ""}</Text>
          )}
        </View>

        {/* Search bar — real-time, same logic as web */}
        <View style={styles.searchWrap}>
          <Ionicons
            name="search-outline"
            size={16}
            color={isFetching ? "#a78bfa" : "#6b7280"}
            style={{ marginLeft: 12 }}
          />
          <TextInput
            ref={inputRef}
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Chercher un jeu, une carte, une plateforme…"
            placeholderTextColor="#4b5563"
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchInput.length > 0 && (
            <TouchableOpacity
              onPress={() => { setSearchInput(""); inputRef.current?.blur(); }}
              style={{ marginRight: 12 }}
            >
              <Ionicons name="close-circle" size={16} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Platforms — fetched from API, use `value` not display name */}
        <FlatList
          data={platforms}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(p) => p.value}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
          renderItem={({ item }) => {
            const active = platformValue === item.value;
            return (
              <TouchableOpacity
                onPress={() => setPlatformValue(item.value)}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {item.emoji ? `${item.emoji} ` : ""}{item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* Sort */}
        <FlatList
          data={SORTS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(s) => s.value}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
          renderItem={({ item }) => {
            const active = sort === item.value;
            return (
              <TouchableOpacity
                onPress={() => setSort(item.value)}
                style={[styles.sortChip, active && styles.sortChipActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.sortText, active && styles.sortTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Product grid */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#7c3aed" size="large" />
          <Text style={styles.loadingText}>Chargement des produits…</Text>
        </View>
      ) : (
        <FlatList
          data={products}
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
  titleRow: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  headerTitle: { color: "#fff", fontSize: 26, fontWeight: "800" },
  count: { color: "#6b7280", fontSize: 13 },
  searchWrap: {
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
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#12121f",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#2d2d4e",
  },
  chipActive: { backgroundColor: "#4c1d95", borderColor: "#7c3aed" },
  chipText: { color: "#9ca3af", fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  sortChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  sortChipActive: { backgroundColor: "#1a0533", borderWidth: 1, borderColor: "#7c3aed" },
  sortText: { color: "#6b7280", fontSize: 12, fontWeight: "500" },
  sortTextActive: { color: "#a78bfa", fontWeight: "700" },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: "#9ca3af", fontSize: 14 },
  grid: { padding: 16, gap: 12 },
  row: { gap: 12 },
});
