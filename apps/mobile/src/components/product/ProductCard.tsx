import React, { useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, Dimensions, StyleSheet,
  Modal, Animated, Pressable,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Product } from "@/types";
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

// ─── Bottom Sheet ───────────────────────────────────────────────────────────

function ChooseTypeSheet({
  visible,
  product,
  onClose,
  onSelect,
}: {
  visible: boolean;
  product: Product;
  onClose: () => void;
  onSelect: (type: "key" | "account") => void;
}) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(400)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, damping: 22, stiffness: 280, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 400, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const keyPrice = product.discountPrice ?? product.price;
  const keyOriginal = product.discountPrice ? product.price : null;
  const accPrice = product.accountDiscountPrice ?? product.accountPrice ?? product.price;
  const accOriginal = product.accountDiscountPrice ? product.accountPrice ?? product.price : null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }], paddingBottom: insets.bottom + 16 }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetTitle}>Choisir un type</Text>
            <Text style={styles.sheetSubtitle} numberOfLines={1}>{product.name}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <Ionicons name="close" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Options */}
        <View style={styles.optionsRow}>
          {/* Key option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => onSelect("key")}
            activeOpacity={0.8}
          >
            <LinearGradient colors={["#2d1b4e", "#1a0533"]} style={styles.optionGradient}>
              <View style={styles.optionIcon}>
                <Text style={{ fontSize: 32 }}>🔑</Text>
              </View>
              <Text style={styles.optionLabel}>Clé / Code</Text>
              <Text style={styles.optionDesc}>Activez sur votre compte</Text>
              <View style={styles.optionPriceRow}>
                <Text style={styles.optionPrice}>{formatPrice(keyPrice)}</Text>
                {keyOriginal && (
                  <Text style={styles.optionOldPrice}>{formatPrice(keyOriginal)}</Text>
                )}
              </View>
              <View style={styles.optionCta}>
                <Text style={styles.optionCtaText}>Ajouter</Text>
                <Ionicons name="arrow-forward" size={13} color="#a78bfa" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Account option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => onSelect("account")}
            activeOpacity={0.8}
          >
            <LinearGradient colors={["#1e2a4e", "#0f1729"]} style={styles.optionGradient}>
              <View style={styles.optionIcon}>
                <Text style={{ fontSize: 32 }}>👤</Text>
              </View>
              <Text style={[styles.optionLabel, { color: "#93c5fd" }]}>Compte</Text>
              <Text style={styles.optionDesc}>Accédez directement</Text>
              <View style={styles.optionPriceRow}>
                <Text style={[styles.optionPrice, { color: "#60a5fa" }]}>{formatPrice(accPrice)}</Text>
                {accOriginal && (
                  <Text style={styles.optionOldPrice}>{formatPrice(accOriginal)}</Text>
                )}
              </View>
              <View style={[styles.optionCta, { borderColor: "#3b5bdb22", backgroundColor: "#3b5bdb22" }]}>
                <Text style={[styles.optionCtaText, { color: "#93c5fd" }]}>Ajouter</Text>
                <Ionicons name="arrow-forward" size={13} color="#93c5fd" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Cancel */}
        <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

// ─── ProductCard ─────────────────────────────────────────────────────────────

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

  function handleAdd() {
    if (stock === 0) return;
    if (hasBoth) {
      setSheetVisible(true);
    } else {
      add(product, 1);
    }
  }

  function handleSelect(type: "key" | "account") {
    setSheetVisible(false);
    setTimeout(() => add(product, 1, type), 200);
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => router.push(`/product/${product.slug}`)}
        style={[styles.card, { width: CARD_WIDTH }]}
        activeOpacity={0.92}
      >
        {/* Image / Gradient thumbnail */}
        <View style={styles.thumb}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill}>
              <View style={styles.thumbEmoji}>
                <Text style={{ fontSize: 34 }}>🎮</Text>
              </View>
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

        {/* Content */}
        <View style={styles.body}>
          <View style={[styles.platformPill, { backgroundColor: gradientColors[0] + "40" }]}>
            <Text style={[styles.platformText, { color: gradientColors[0] === "#003791" ? "#60a5fa" : "#e5e7eb" }]}>
              {product.platform}
            </Text>
          </View>

          <Text style={styles.name} numberOfLines={2}>{product.name}</Text>

          {hasBoth && (
            <View style={styles.variantRow}>
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
            {hasVariants && <Text style={styles.fromText}>À partir de </Text>}
            <Text style={styles.price}>{formatPrice(displayPrice)}</Text>
            {hasDiscount && (
              <Text style={styles.oldPrice}>{formatPrice(product.price)}</Text>
            )}
          </View>

          <TouchableOpacity
            onPress={handleAdd}
            disabled={stock === 0}
            style={[styles.addBtn, stock === 0 && styles.addBtnDisabled]}
            activeOpacity={0.8}
          >
            <Ionicons
              name={stock === 0 ? "close-circle-outline" : hasBoth ? "options-outline" : "cart-outline"}
              size={13}
              color={stock === 0 ? "#4b5563" : "#a78bfa"}
            />
            <Text style={[styles.addBtnText, stock === 0 && styles.addBtnTextDisabled]}>
              {stock === 0 ? "Indisponible" : hasBoth ? "Choisir" : "Ajouter"}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      <ChooseTypeSheet
        visible={sheetVisible}
        product={product}
        onClose={() => setSheetVisible(false)}
        onSelect={handleSelect}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // Card
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#12121f",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#2d2d4e",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  thumb: { height: 130, backgroundColor: "#1a1a2e", overflow: "hidden", position: "relative" },
  thumbEmoji: { flex: 1, alignItems: "center", justifyContent: "center" },
  discountBadge: {
    position: "absolute", top: 8, right: 8,
    backgroundColor: "#db2777", borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  discountText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  outOfStock: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center", justifyContent: "center",
  },
  outOfStockText: { color: "#f87171", fontWeight: "800", fontSize: 13 },
  stockWarning: {
    position: "absolute", bottom: 6, left: 6,
    backgroundColor: "rgba(0,0,0,0.7)", borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  stockWarningText: { color: "#fbbf24", fontSize: 10, fontWeight: "700" },
  body: { padding: 10, gap: 5 },
  platformPill: { alignSelf: "flex-start", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  platformText: { fontSize: 10, fontWeight: "700" },
  name: { color: "#f9fafb", fontSize: 13, fontWeight: "600", lineHeight: 18 },
  variantRow: { flexDirection: "row", alignItems: "center", gap: 4 },
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#12121f",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: "#2d2d4e",
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 30,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2d2d4e",
    alignSelf: "center",
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sheetTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  sheetSubtitle: { color: "#6b7280", fontSize: 13, marginTop: 2 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
  },
  optionsRow: { flexDirection: "row", gap: 12 },
  optionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#6d28d9",
  },
  optionGradient: {
    padding: 16,
    gap: 8,
    alignItems: "center",
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  optionLabel: { color: "#c4b5fd", fontSize: 15, fontWeight: "800" },
  optionDesc: { color: "#6b7280", fontSize: 11, textAlign: "center" },
  optionPriceRow: { flexDirection: "row", alignItems: "baseline", gap: 5, flexWrap: "wrap", justifyContent: "center" },
  optionPrice: { color: "#a78bfa", fontSize: 16, fontWeight: "900" },
  optionOldPrice: { color: "#4b5563", fontSize: 12, textDecorationLine: "line-through" },
  optionCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#7c3aed22",
    borderWidth: 1,
    borderColor: "#7c3aed44",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 4,
  },
  optionCtaText: { color: "#a78bfa", fontSize: 13, fontWeight: "700" },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#1a1a2e",
  },
  cancelText: { color: "#6b7280", fontSize: 15, fontWeight: "600" },
});
