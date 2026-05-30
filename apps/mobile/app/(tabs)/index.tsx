import React from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getHomeData, getSiteSettings } from "@/api/products";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { Image } from "expo-image";
import { CategoryStrip } from "@/components/home/CategoryStrip";
import { SectionHeader } from "@/components/home/SectionHeader";
import { ProductCard } from "@/components/product/ProductCard";

const SERVICES = [
  { icon: "flash" as const, label: "Livraison\ninstantanée" },
  { icon: "shield-checkmark" as const, label: "Paiement\nsécurisé" },
  { icon: "headset" as const, label: "Support\n7j/7" },
  { icon: "star" as const, label: "4.9/5\nclients" },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["home"],
    queryFn: getHomeData,
    staleTime: 60_000,
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: getSiteSettings,
    staleTime: 10 * 60_000,
  });

  const siteName = settings?.siteName ?? "LootStore";
  const logoUrl = settings?.logoUrl ?? null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={{ width: 32, height: 32 }} contentFit="contain" />
            ) : (
              <Text style={styles.logoLetter}>{siteName.charAt(0)}</Text>
            )}
          </View>
          <Text style={styles.logoText}>{siteName.toUpperCase()}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/ticket/new")}
          style={styles.supportBtn}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#a78bfa" />
        </TouchableOpacity>
      </View>

      {/* Hero */}
      <HeroCarousel />

      {/* Services strip */}
      <View style={styles.servicesRow}>
        {SERVICES.map((s, i) => (
          <View
            key={i}
            style={[styles.serviceItem, i < 3 && styles.serviceItemBorder]}
          >
            <View style={styles.serviceIcon}>
              <Ionicons name={s.icon} size={16} color="#a78bfa" />
            </View>
            <Text style={styles.serviceLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <View style={{ paddingHorizontal: 20 }}>
          <SectionHeader title="Plateformes" linkHref="/(tabs)/products" />
        </View>
        <CategoryStrip />
      </View>

      {/* Nouveautés */}
      <View style={[styles.section, { paddingHorizontal: 20 }]}>
        <SectionHeader title="Nouveautés" linkHref="/(tabs)/products" />
        {isLoading ? (
          <ActivityIndicator color="#7c3aed" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={data?.newArrivals ?? []}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ gap: 12 }}
            scrollEnabled
            renderItem={({ item }) => <ProductCard product={item} />}
          />
        )}
      </View>

      {/* Deals */}
      <View style={[styles.section, { paddingHorizontal: 20 }]}>
        <SectionHeader title="🔥 Top Promos" linkHref="/(tabs)/products" />
        {isLoading ? (
          <ActivityIndicator color="#7c3aed" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={data?.deals ?? []}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ gap: 12 }}
            renderItem={({ item }) => <ProductCard product={item} />}
          />
        )}
      </View>

      {/* CTA Banner */}
      <View style={[styles.ctaBanner, { marginHorizontal: 20 }]}>
        <Text style={styles.ctaEmoji}>🎮</Text>
        <Text style={styles.ctaTitle}>Prêt à jouer ?</Text>
        <Text style={styles.ctaSub}>
          Des milliers de jeux disponibles instantanément
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/products")}
          style={styles.ctaButton}
        >
          <Text style={styles.ctaButtonText}>Explorer la boutique</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d14" },
  topBar: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: { color: "#fff", fontSize: 16, fontWeight: "900" },
  logoText: { color: "#fff", fontSize: 20, fontWeight: "900", letterSpacing: 1 },
  supportBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#2d2d4e",
    alignItems: "center",
    justifyContent: "center",
  },
  servicesRow: {
    flexDirection: "row",
    backgroundColor: "#12121f",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#2d2d4e",
    marginVertical: 20,
  },
  serviceItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    gap: 6,
  },
  serviceItemBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#2d2d4e",
  },
  serviceIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#1a0533",
    alignItems: "center",
    justifyContent: "center",
  },
  serviceLabel: {
    color: "#9ca3af",
    fontSize: 9,
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 13,
  },
  section: { marginBottom: 28, gap: 14 },
  ctaBanner: {
    borderRadius: 20,
    backgroundColor: "#12121f",
    borderWidth: 1,
    borderColor: "#2d2d4e",
    padding: 24,
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  ctaEmoji: { fontSize: 40, marginBottom: 4 },
  ctaTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  ctaSub: { color: "#9ca3af", fontSize: 13, textAlign: "center" },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  ctaButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
