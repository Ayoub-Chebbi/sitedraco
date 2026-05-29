import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getProductBySlug } from "@/api/products";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/utils/format";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import type { ProductVariant } from "@/types";

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const add = useCartStore((s) => s.add);
  const [qty, setQty] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug(slug),
    enabled: !!slug,
  });

  const p = product;
  const hasVariants = (p?.variants?.length ?? 0) > 0;
  const hasBoth = p?.productType === "both";
  const stock = p?._count.keys ?? 0;

  const [variant, setVariant] = useState<"key" | "account">(
    p?.productType === "account" ? "account" : "key"
  );
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    p?.variants?.[0] ?? null
  );

  if (isLoading || !p) return <LoadingSpinner message="Chargement du produit…" />;

  // Price logic
  let displayPrice: number;
  let originalPrice: number;
  let hasDiscount: boolean;

  if (hasVariants && selectedVariant) {
    displayPrice = selectedVariant.discountPrice ?? selectedVariant.price;
    originalPrice = selectedVariant.price;
    hasDiscount = !!(selectedVariant.discountPrice && selectedVariant.discountPrice < selectedVariant.price);
  } else {
    displayPrice = variant === "key"
      ? (p.discountPrice ?? p.price)
      : (p.accountDiscountPrice ?? p.accountPrice ?? p.price);
    originalPrice = variant === "key" ? p.price : (p.accountPrice ?? p.price);
    hasDiscount = displayPrice < originalPrice;
  }

  function handleAddToCart() {
    if (hasVariants && !selectedVariant) {
      Alert.alert("Sélection requise", "Veuillez choisir un montant.");
      return;
    }

    add(p, qty, hasVariants ? undefined : (hasBoth ? variant : undefined), hasVariants ? selectedVariant! : undefined);

    Alert.alert(
      "✅ Ajouté",
      `${p.name}${hasVariants && selectedVariant ? ` — ${selectedVariant.name}` : hasBoth ? ` (${variant === "key" ? "Clé" : "Compte"})` : ""} ajouté au panier.`,
      [
        { text: "Continuer", style: "cancel" },
        { text: "Voir le panier", onPress: () => router.push("/(tabs)/cart") },
      ]
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0d0d14" }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Image / Hero */}
        {p.imageUrl ? (
          <Image source={p.imageUrl} style={{ width: "100%", height: 260 }} contentFit="cover" />
        ) : (
          <LinearGradient colors={["#4c1d95", "#1e1b4b"]} style={{ height: 260, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 72 }}>🎮</Text>
          </LinearGradient>
        )}

        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ position: "absolute", top: insets.top + 8, left: 16, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 10, padding: 8 }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>← Retour</Text>
        </TouchableOpacity>

        <View style={{ padding: 20, gap: 16 }}>
          {/* Platform + title */}
          <View style={{ gap: 8 }}>
            <Badge label={p.platform} color="#a78bfa" />
            <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800", lineHeight: 28 }}>{p.name}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ color: "#facc15" }}>⭐</Text>
              <Text style={{ color: "#9ca3af", fontSize: 13 }}>{p.rating} ({p.reviewCount} avis)</Text>
              {stock > 0 && stock <= 5 && (
                <View style={{ backgroundColor: "#7f1d1d22", borderWidth: 1, borderColor: "#7f1d1d", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ color: "#f87171", fontSize: 11, fontWeight: "600" }}>⚡ Plus que {stock} en stock</Text>
                </View>
              )}
            </View>
          </View>

          {/* Custom variant selector (gift cards / denominations) */}
          {hasVariants && (
            <View style={{ gap: 8 }}>
              <Text style={{ color: "#6b7280", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 }}>
                Choisir un montant
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {p.variants.map((v) => {
                  const vDisplay = v.discountPrice ?? v.price;
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <TouchableOpacity
                      key={v.id}
                      onPress={() => setSelectedVariant(v)}
                      activeOpacity={0.8}
                      style={{
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: isSelected ? "#7c3aed" : "#2d2d4e",
                        backgroundColor: isSelected ? "#2d1b4e" : "#12121f",
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        minWidth: 90,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: isSelected ? "#e9d5ff" : "#9ca3af", fontSize: 13, fontWeight: "700" }}>{v.name}</Text>
                      <Text style={{ color: "#a78bfa", fontSize: 15, fontWeight: "800" }}>{formatPrice(vDisplay)}</Text>
                      {v.discountPrice && v.discountPrice < v.price && (
                        <Text style={{ color: "#4b5563", fontSize: 11, textDecorationLine: "line-through" }}>{formatPrice(v.price)}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Key / account selector — only when no custom variants */}
          {!hasVariants && hasBoth && (
            <View style={{ gap: 8 }}>
              <Text style={{ color: "#6b7280", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 }}>
                Type de produit
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {([
                  { value: "key" as const, emoji: "🔑", label: "Clé / Code", price: p.price, discountPrice: p.discountPrice },
                  { value: "account" as const, emoji: "👤", label: "Compte", price: p.accountPrice ?? 0, discountPrice: p.accountDiscountPrice },
                ]).map(({ value, emoji, label, price, discountPrice }) => {
                  const vDisplay = discountPrice ?? price;
                  const isSelected = variant === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() => setVariant(value)}
                      activeOpacity={0.8}
                      style={{
                        flex: 1, borderRadius: 14, borderWidth: 2,
                        borderColor: isSelected ? "#7c3aed" : "#2d2d4e",
                        backgroundColor: isSelected ? "#2d1b4e" : "#12121f",
                        padding: 14, gap: 4,
                      }}
                    >
                      <Text style={{ fontSize: 20 }}>{emoji}</Text>
                      <Text style={{ color: isSelected ? "#e9d5ff" : "#9ca3af", fontSize: 13, fontWeight: "700" }}>{label}</Text>
                      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 5 }}>
                        <Text style={{ color: "#a78bfa", fontSize: 14, fontWeight: "800" }}>{formatPrice(vDisplay)}</Text>
                        {discountPrice && discountPrice < price && (
                          <Text style={{ color: "#4b5563", fontSize: 11, textDecorationLine: "line-through" }}>{formatPrice(price)}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Price */}
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
            <Text style={{ color: "#a78bfa", fontSize: 28, fontWeight: "900" }}>{formatPrice(displayPrice)}</Text>
            {hasDiscount && (
              <>
                <Text style={{ color: "#6b7280", fontSize: 18, textDecorationLine: "line-through" }}>{formatPrice(originalPrice)}</Text>
                <View style={{ backgroundColor: "#db2777", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                    -{Math.round(((originalPrice - displayPrice) / originalPrice) * 100)}%
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Steam username notice */}
          {p.requiresSteamUsername && (
            <View style={{ backgroundColor: "#172554", borderWidth: 1, borderColor: "#1d4ed8", borderRadius: 12, padding: 14, flexDirection: "row", gap: 10 }}>
              <Ionicons name="logo-steam" size={18} color="#60a5fa" style={{ marginTop: 1 }} />
              <Text style={{ color: "#93c5fd", fontSize: 13, flex: 1, lineHeight: 20 }}>
                Ce produit nécessite votre pseudo Steam. Vous devrez le saisir lors du paiement pour recevoir le cadeau.
              </Text>
            </View>
          )}

          {/* Description */}
          {p.description && (
            <View style={{ backgroundColor: "#1a1a2e", borderRadius: 12, borderWidth: 1, borderColor: "#2d2d4e", padding: 16 }}>
              <Text style={{ color: "#9ca3af", fontSize: 14, lineHeight: 22 }}>{p.description}</Text>
            </View>
          )}

          {/* Guarantees */}
          <View style={{ backgroundColor: "#1a1a2e", borderRadius: 12, borderWidth: 1, borderColor: "#2d2d4e", padding: 16, gap: 10 }}>
            {[
              ["⚡", "Livraison instantanée après paiement"],
              ["🔒", "Paiement 100% sécurisé"],
              ["🎧", "Support disponible 7j/7"],
            ].map(([emoji, label]) => (
              <View key={label as string} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={{ fontSize: 16 }}>{emoji}</Text>
                <Text style={{ color: "#9ca3af", fontSize: 13 }}>{label as string}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        backgroundColor: "#12121f",
        borderTopWidth: 1, borderTopColor: "#2d2d4e",
        padding: 16, paddingBottom: insets.bottom + 12,
        flexDirection: "row", alignItems: "center", gap: 12,
      }}>
        {!hasVariants && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#1a1a2e", borderRadius: 10, borderWidth: 1, borderColor: "#2d2d4e", paddingHorizontal: 12, paddingVertical: 8 }}>
            <TouchableOpacity onPress={() => setQty(Math.max(1, qty - 1))}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 18 }}>−</Text>
            </TouchableOpacity>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16, minWidth: 20, textAlign: "center" }}>{qty}</Text>
            <TouchableOpacity onPress={() => setQty(qty + 1)}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 18 }}>+</Text>
            </TouchableOpacity>
          </View>
        )}

        <Button
          title={stock === 0 ? "Rupture de stock" : "Ajouter au panier"}
          onPress={handleAddToCart}
          disabled={stock === 0 || (hasVariants && !selectedVariant)}
          style={{ flex: 1 }}
          size="lg"
        />
      </View>
    </View>
  );
}
