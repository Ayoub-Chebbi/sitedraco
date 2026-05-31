import React, { useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, Dimensions, StyleSheet,
  Modal, Animated, Pressable, ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Product, ProductVariant } from "@/types";
import { formatPrice } from "@/utils/format";
import { useCartStore } from "@/store/cart";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

const PLATFORM_COLORS: Record<string, [string, string]> = {
  PlayStation: ["#003791", "#0070cc"],
  Xbox: ["#107c10", "#52b043"],
  PC: ["#1a73e8", "#0a47a9"],
  Nintendo: ["#e4000f", "#9b0007"],
  Mobile: ["#7c3aed", "#4c1d95"],
  "Gift Cards": ["#b45309", "#78350f"],
};

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────

function PickerSheet({
  visible,
  product,
  onClose,
  onAdded,
}: {
  visible: boolean;
  product: Product;
  onClose: () => void;
  onAdded: () => void;
}) {
  const insets = useSafeAreaInsets();
  const add = useCartStore((s) => s.add);
  const translateY = useRef(new Animated.Value(600)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const hasVariants = (product.variants?.length ?? 0) > 0;
  const hasBoth = product.productType === "both";

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, damping: 22, stiffness: 260, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 600, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  function selectVariant(v: ProductVariant) {
    onClose();
    setTimeout(() => { add(product, 1, undefined, v); onAdded(); }, 220);
  }

  function selectType(type: "key" | "account") {
    onClose();
    setTimeout(() => { add(product, 1, type); onAdded(); }, 220);
  }

  const title = hasVariants ? "Choisir un montant" : "Choisir un type";

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY }], paddingBottom: insets.bottom + 12 }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.sheetThumb} contentFit="cover" />
          ) : (
            <View style={[styles.sheetThumb, { backgroundColor: "#1a1a2e", alignItems: "center", justifyContent: "center" }]}>
              <Text style={{ fontSize: 20 }}>🎮</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Text style={styles.sheetSubtitle} numberOfLines={2}>{product.name}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <Ionicons name="close" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.dividerLine} />

        {/* Variants list */}
        {hasVariants ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 360 }}
            contentContainerStyle={{ gap: 10 }}
          >
            {product.variants!.map((v) => {
              const price = v.discountPrice ?? v.price;
              const hasDisc = v.discountPrice != null && v.discountPrice < v.price;
              const pct = hasDisc ? Math.round(((v.price - v.discountPrice!) / v.price) * 100) : 0;
              return (
                <TouchableOpacity
                  key={v.id}
                  onPress={() => selectVariant(v)}
                  style={styles.variantRow}
                  activeOpacity={0.75}
                >
                  <LinearGradient colors={["#1a0533", "#12121f"]} style={styles.variantRowGrad}>
                    {/* Name row */}
                    <View style={styles.variantNameRow}>
                      <View style={styles.variantDot} />
                      <Text style={styles.variantName} numberOfLines={1}>{v.name}</Text>
                      {hasDisc && (
                        <View style={styles.discBadge}>
                          <Text style={styles.discBadgeText}>-{pct}%</Text>
                        </View>
                      )}
                    </View>
                    {/* Price + button row */}
                    <View style={styles.variantPriceRow}>
                      {hasDisc && (
                        <Text style={styles.variantOld}>{formatPrice(v.price)}</Text>
                      )}
                      <Text style={styles.variantPrice}>{formatPrice(price)}</Text>
                      <View style={styles.addChip}>
                        <Ionicons name="cart-outline" size={12} color="#a78bfa" />
                        <Text style={styles.addChipText}>Ajouter</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          // Key / Account cards side by side
          <View style={styles.typeRow}>
            <TouchableOpacity style={[styles.typeCard, { borderColor: "#6d28d9" }]} onPress={() => selectType("key")} activeOpacity={0.8}>
              <LinearGradient colors={["#2d1b4e", "#1a0533"]} style={styles.typeGrad}>
                <Text style={{ fontSize: 30, marginBottom: 6 }}>🔑</Text>
                <Text style={styles.typeLabel}>Clé / Code</Text>
                <Text style={styles.typeDesc}>Activez sur votre compte</Text>
                <Text style={styles.typePrice}>{formatPrice(product.discountPrice ?? product.price)}</Text>
                {product.discountPrice && (
                  <Text style={styles.typeOld}>{formatPrice(product.price)}</Text>
                )}
                <View style={styles.typeBtn}>
                  <Text style={styles.typeBtnText}>Ajouter</Text>
                  <Ionicons name="arrow-forward" size={12} color="#a78bfa" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.typeCard, { borderColor: "#3b5bdb" }]} onPress={() => selectType("account")} activeOpacity={0.8}>
              <LinearGradient colors={["#1e2a4e", "#0f1729"]} style={styles.typeGrad}>
                <Text style={{ fontSize: 30, marginBottom: 6 }}>👤</Text>
                <Text style={[styles.typeLabel, { color: "#93c5fd" }]}>Compte</Text>
                <Text style={styles.typeDesc}>Accès direct</Text>
                <Text style={[styles.typePrice, { color: "#60a5fa" }]}>
                  {formatPrice(product.accountDiscountPrice ?? product.accountPrice ?? product.price)}
                </Text>
                {product.accountDiscountPrice && (
                  <Text style={styles.typeOld}>{formatPrice(product.accountPrice ?? product.price)}</Text>
                )}
                <View style={[styles.typeBtn, { backgroundColor: "#3b5bdb22", borderColor: "#3b5bdb44" }]}>
                  <Text style={[styles.typeBtnText, { color: "#93c5fd" }]}>Ajouter</Text>
                  <Ionicons name="arrow-forward" size={12} color="#93c5fd" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Cancel */}
        <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

// ─── ProductCard ──────────────────────────────────────────────────────────────

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const add = useCartStore((s) => s.add);
  const hasBoth = product.productType === "both";
  const hasVariants = (product.variants?.length ?? 0) > 0;
  const [sheetVisible, setSheetVisible] = useState(false);

  const stock =
    product.availableKeys != null ? product.availableKeys
    : (product._count?.keys ?? 0) + (product.manualStock ?? 0);

  const minVariantPrice = hasVariants && product.variants?.length
    ? Math.min(...product.variants.map((v) => v.discountPrice ?? v.price))
    : null;
  const hasDiscount = minVariantPrice !== null
    ? false
    : product.discountPrice != null && product.discountPrice < product.price;
  const displayPrice = minVariantPrice ?? product.discountPrice ?? product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;
  const gradientColors = (PLATFORM_COLORS[product.platform] ?? ["#4c1d95", "#1e1b4b"]) as [string, string];

  const needsPicker = hasBoth || hasVariants;

  function handleAdd() {
    if (stock === 0) return;
    if (needsPicker) {
      setSheetVisible(true);
    } else {
      add(product, 1);
      router.push("/(tabs)/cart");
    }
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => router.push(`/product/${product.slug}`)}
        style={[styles.card, { width: CARD_WIDTH }]}
        activeOpacity={0.92}
      >
        <View style={styles.thumb}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill}>
              <View style={styles.thumbEmoji}><Text style={{ fontSize: 34 }}>🎮</Text></View>
            </LinearGradient>
          )}
          <LinearGradient colors={["transparent", "rgba(0,0,0,0.6)"]} style={StyleSheet.absoluteFill} />
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discountPct}%</Text>
            </View>
          )}
          {stock === 0 && (
            <View style={styles.outOfStock}>
              <Text style={styles.outOfStockText}>Rupture de stock</Text>
            </View>
          )}
          {stock > 0 && stock <= 3 && (
            <View style={styles.stockWarning}>
              <Text style={styles.stockWarningText}>⚡ {stock} restant</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <View style={[styles.platformPill, { backgroundColor: gradientColors[0] + "40" }]}>
            <Text style={[styles.platformText, { color: gradientColors[0] === "#003791" ? "#60a5fa" : "#e5e7eb" }]}>
              {product.platform}
            </Text>
          </View>

          <Text style={styles.name} numberOfLines={2}>{product.name}</Text>

          {hasBoth && !hasVariants && (
            <View style={styles.variantBadgeRow}>
              <View style={styles.variantPill}>
                <Text style={styles.variantPillKey}>🔑 Clé</Text>
              </View>
              <Text style={styles.variantPlus}>+</Text>
              <View style={[styles.variantPill, styles.variantPillAccBg]}>
                <Text style={styles.variantPillAcc}>👤 Compte</Text>
              </View>
            </View>
          )}

          <View style={styles.priceRow}>
            {(hasVariants || hasBoth) && <Text style={styles.fromText}>À partir de </Text>}
            <Text style={styles.price}>{formatPrice(displayPrice)}</Text>
            {hasDiscount && <Text style={styles.oldPrice}>{formatPrice(product.price)}</Text>}
          </View>

          <TouchableOpacity
            onPress={handleAdd}
            disabled={stock === 0}
            style={[styles.addBtn, stock === 0 && styles.addBtnDisabled]}
            activeOpacity={0.8}
          >
            <Ionicons
              name={stock === 0 ? "close-circle-outline" : needsPicker ? "options-outline" : "cart-outline"}
              size={13}
              color={stock === 0 ? "#4b5563" : "#a78bfa"}
            />
            <Text style={[styles.addBtnText, stock === 0 && styles.addBtnTextDisabled]}>
              {stock === 0 ? "Indisponible" : needsPicker ? "Choisir" : "Ajouter"}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      <PickerSheet
        visible={sheetVisible}
        product={product}
        onClose={() => setSheetVisible(false)}
        onAdded={() => router.push("/(tabs)/cart")}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // Card
  card: {
    borderRadius: 16, overflow: "hidden", backgroundColor: "#12121f",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "#2d2d4e",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  thumb: { height: 130, backgroundColor: "#1a1a2e", overflow: "hidden", position: "relative" },
  thumbEmoji: { flex: 1, alignItems: "center", justifyContent: "center" },
  discountBadge: {
    position: "absolute", top: 8, right: 8, backgroundColor: "#db2777",
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
  },
  discountText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  outOfStock: {
    ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center", justifyContent: "center",
  },
  outOfStockText: { color: "#f87171", fontWeight: "800", fontSize: 13 },
  stockWarning: {
    position: "absolute", bottom: 6, left: 6, backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
  },
  stockWarningText: { color: "#fbbf24", fontSize: 10, fontWeight: "700" },
  body: { padding: 10, gap: 5 },
  platformPill: { alignSelf: "flex-start", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  platformText: { fontSize: 10, fontWeight: "700" },
  name: { color: "#f9fafb", fontSize: 13, fontWeight: "600", lineHeight: 18 },
  variantBadgeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  variantPill: {
    backgroundColor: "#2d1b4e", borderWidth: 1, borderColor: "#6d28d9",
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  variantPillAccBg: { backgroundColor: "#1e2a4e", borderColor: "#3b5bdb" },
  variantPillKey: { color: "#c4b5fd", fontSize: 9, fontWeight: "700" },
  variantPillAcc: { color: "#93c5fd", fontSize: 9, fontWeight: "700" },
  variantPlus: { color: "#4b5563", fontSize: 10 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 4, flexWrap: "wrap" },
  fromText: { color: "#6b7280", fontSize: 10 },
  price: { color: "#a78bfa", fontSize: 15, fontWeight: "800" },
  oldPrice: { color: "#4b5563", fontSize: 11, textDecorationLine: "line-through" },
  addBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, backgroundColor: "#1a0533", borderWidth: 1, borderColor: "#7c3aed",
    borderRadius: 8, paddingVertical: 7, marginTop: 2,
  },
  addBtnDisabled: { backgroundColor: "#1a1a2e", borderColor: "#2d2d4e" },
  addBtnText: { color: "#a78bfa", fontSize: 12, fontWeight: "700" },
  addBtnTextDisabled: { color: "#4b5563" },

  // Sheet
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.65)" },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#12121f",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 1, borderLeftWidth: StyleSheet.hairlineWidth, borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: "#2d2d4e",
    padding: 20, gap: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.6, shadowRadius: 24, elevation: 30,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#2d2d4e", alignSelf: "center" },
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  sheetThumb: { width: 48, height: 48, borderRadius: 12 },
  sheetTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  sheetSubtitle: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: "#1a1a2e",
    alignItems: "center", justifyContent: "center",
  },
  dividerLine: { height: StyleSheet.hairlineWidth, backgroundColor: "#2d2d4e" },

  // Variant rows (gift cards etc)
  variantRow: { borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: "#2d2d4e" },
  variantRowGrad: { paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  variantNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  variantDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#7c3aed", flexShrink: 0 },
  variantName: { color: "#e5e7eb", fontSize: 14, fontWeight: "700", flex: 1 },
  variantPriceRow: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "flex-end" },
  discBadge: { backgroundColor: "#db2777", borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  discBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  variantOld: { color: "#4b5563", fontSize: 12, textDecorationLine: "line-through" },
  variantPrice: { color: "#a78bfa", fontSize: 15, fontWeight: "900" },
  addChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#1a0533", borderWidth: 1, borderColor: "#7c3aed44",
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  addChipText: { color: "#a78bfa", fontSize: 12, fontWeight: "700" },

  // Key / Account cards
  typeRow: { flexDirection: "row", gap: 12 },
  typeCard: { flex: 1, borderRadius: 16, overflow: "hidden", borderWidth: 1 },
  typeGrad: { padding: 16, gap: 4, alignItems: "center" },
  typeLabel: { color: "#c4b5fd", fontSize: 15, fontWeight: "800" },
  typeDesc: { color: "#6b7280", fontSize: 11, textAlign: "center" },
  typePrice: { color: "#a78bfa", fontSize: 16, fontWeight: "900", marginTop: 4 },
  typeOld: { color: "#4b5563", fontSize: 11, textDecorationLine: "line-through" },
  typeBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#7c3aed22", borderWidth: 1, borderColor: "#7c3aed44",
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, marginTop: 6,
  },
  typeBtnText: { color: "#a78bfa", fontSize: 13, fontWeight: "700" },

  // Cancel
  cancelBtn: {
    alignItems: "center", paddingVertical: 13,
    borderRadius: 12, backgroundColor: "#1a1a2e",
  },
  cancelText: { color: "#6b7280", fontSize: 15, fontWeight: "600" },
});
