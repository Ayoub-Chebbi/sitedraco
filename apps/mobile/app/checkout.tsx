import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, KeyboardAvoidingView, Platform,
  Alert, Linking, StyleSheet, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { api } from "@/api/client";
import { formatPrice } from "@/utils/format";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import type { CouponResult } from "@/types";

function parseQuery(url: string): Record<string, string> {
  const idx = url.indexOf("?");
  if (idx === -1) return {};
  return Object.fromEntries(
    url.slice(idx + 1).split("&").map((pair) => {
      const [k, v = ""] = pair.split("=");
      return [decodeURIComponent(k), decodeURIComponent(v)];
    })
  );
}

function itemPrice(item: ReturnType<typeof useCartStore.getState>["items"][0]) {
  if (item.variantPrice !== undefined) return item.variantPrice;
  if (item.variant === "account") {
    return item.product.accountDiscountPrice ?? item.product.accountPrice ?? item.product.price;
  }
  return item.product.discountPrice ?? item.product.price;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, total, clear } = useCartStore();
  const { user } = useAuthStore();

  const [email, setEmail] = useState(user?.email ?? "");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Steam username
  const needsSteam = items.some((i) => i.product.requiresSteamUsername);
  const [steamUsername, setSteamUsername] = useState("");
  const [steamError, setSteamError] = useState("");

  // Coupon
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null);

  const subtotal = total();
  const discount = appliedCoupon?.discount ?? 0;
  const finalTotal = Math.max(0, subtotal - discount);

  const pendingRef = useRef<{ orderId: string; email: string; paymentId: string } | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  async function pollPaymentStatus() {
    if (!pendingRef.current) return;
    const { orderId, email: pendingEmail, paymentId } = pendingRef.current;

    try {
      const { orderNumber } = await api.post<{ orderNumber: string }>(
        "/api/payment/flouci/verify",
        { orderId, paymentId }
      );
      pendingRef.current = null;
      if (pollRef.current) clearInterval(pollRef.current);
      setLoading(false);
      clear();
      router.replace(`/order/success?orderNumber=${orderNumber}&email=${encodeURIComponent(pendingEmail)}`);
    } catch {
      // Still pending, keep polling
    }
  }

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function applyCode() {
    if (!couponInput.trim()) return;
    setCouponError("");
    setCouponLoading(true);
    try {
      const result = await api.post<CouponResult>("/api/coupons/validate", {
        code: couponInput.trim(),
        amount: subtotal,
      });
      setAppliedCoupon(result);
      setCouponInput("");
    } catch (err: any) {
      setCouponError(err.message ?? "Code invalide.");
    } finally {
      setCouponLoading(false);
    }
  }

  async function handlePay() {
    setEmailError("");
    setSteamError("");

    if (!email || !email.includes("@")) {
      setEmailError("Entrez un email valide.");
      return;
    }
    if (needsSteam && !steamUsername.trim()) {
      setSteamError("Veuillez entrer votre pseudo Steam.");
      return;
    }
    if (items.length === 0) {
      Alert.alert("Panier vide", "Ajoutez des produits avant de commander.");
      return;
    }

    setLoading(true);
    try {
      const { paymentUrl, orderId, paymentId } = await api.post<{ paymentUrl: string; orderId: string; paymentId: string }>(
        "/api/mobile/payment/flouci/initiate",
        {
          email,
          items: items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
            ...(i.variantId && { variantId: i.variantId }),
          })),
          ...(appliedCoupon && { couponCode: appliedCoupon.code }),
          ...(needsSteam && steamUsername.trim() && { steamUsername: steamUsername.trim() }),
        }
      );

      pendingRef.current = { orderId, email, paymentId };

      // Open payment in web browser
      await WebBrowser.openBrowserAsync(paymentUrl);

      // Start polling for payment status (every 3 seconds, max 5 minutes)
      let pollCount = 0;
      pollRef.current = setInterval(() => {
        pollCount++;
        if (pollCount > 100) {
          if (pollRef.current) clearInterval(pollRef.current);
          setLoading(false);
          Alert.alert("Vérification", "Vérifiez votre email pour le statut du paiement.");
          return;
        }
        pollPaymentStatus();
      }, 3000);
    } catch (e: any) {
      setLoading(false);
      Alert.alert("Erreur", e.message ?? "Une erreur s'est produite. Réessayez.");
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScreenHeader title="Commander" showBack />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Order summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Récapitulatif</Text>
          {items.map((item, idx) => {
            const price = itemPrice(item);
            const label = item.variantName ? `${item.product.name} — ${item.variantName}` : item.product.name;
            return (
              <View key={idx} style={styles.summaryItem}>
                <View style={styles.summaryThumb}>
                  <Text style={{ fontSize: 20 }}>🎮</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryName} numberOfLines={1}>{label}</Text>
                  <Text style={styles.summaryMeta}>×{item.quantity} · {item.product.platform}</Text>
                </View>
                <Text style={styles.summaryPrice}>{formatPrice(price * item.quantity)}</Text>
              </View>
            );
          })}
          <View style={styles.divider} />
          {/* Subtotal */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total</Text>
            <Text style={[styles.totalAmount, { fontSize: 14, color: "#9ca3af" }]}>{formatPrice(subtotal)}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={{ color: "#4ade80", fontSize: 14 }}>🏷️ {appliedCoupon?.code}</Text>
              <Text style={{ color: "#4ade80", fontSize: 14, fontWeight: "700" }}>-{formatPrice(discount)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#2d2d4e", paddingTop: 10 }]}>
            <Text style={[styles.totalLabel, { fontSize: 16 }]}>Total</Text>
            <Text style={[styles.totalAmount, { color: "#a78bfa" }]}>{formatPrice(finalTotal)}</Text>
          </View>
        </View>

        {/* Email */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Email de réception</Text>
          <Text style={styles.sectionSub}>Votre clé de jeu sera envoyée à cette adresse</Text>
          <Input
            label="Email"
            placeholder="vous@exemple.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={emailError}
          />
        </View>

        {/* Steam username */}
        {needsSteam && (
          <View style={[styles.card, { borderColor: "#1d4ed8", backgroundColor: "#0f1e3d" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Ionicons name="logo-steam" size={18} color="#60a5fa" />
              <Text style={[styles.sectionTitle, { color: "#93c5fd" }]}>Pseudo Steam requis</Text>
            </View>
            <Text style={styles.sectionSub}>
              Ce produit est offert en cadeau via Steam. Entrez votre pseudo Steam exact pour que nous puissions vous ajouter.
            </Text>
            <Input
              label="Pseudo Steam"
              placeholder="VotrePseudoSteam"
              value={steamUsername}
              onChangeText={(t) => { setSteamUsername(t); setSteamError(""); }}
              autoCapitalize="none"
              autoCorrect={false}
              error={steamError}
            />
          </View>
        )}

        {/* Coupon code */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Code promo</Text>
          {appliedCoupon ? (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#052e16", borderWidth: 1, borderColor: "#15803d", borderRadius: 10, padding: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="checkmark-circle" size={18} color="#4ade80" />
                <View>
                  <Text style={{ color: "#4ade80", fontWeight: "700", fontSize: 14 }}>{appliedCoupon.code}</Text>
                  <Text style={{ color: "#6b7280", fontSize: 12 }}>
                    {appliedCoupon.type === "percentage" ? `${appliedCoupon.value}% de réduction` : `${formatPrice(appliedCoupon.value)} de réduction`}
                    {" · "}-{formatPrice(appliedCoupon.discount)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => { setAppliedCoupon(null); setCouponError(""); }}>
                <Ionicons name="close-circle" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="Ex : PROMO20"
                  value={couponInput}
                  onChangeText={(t) => { setCouponInput(t.toUpperCase()); setCouponError(""); }}
                  onSubmitEditing={applyCode}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  error={couponError}
                />
              </View>
              <TouchableOpacity
                onPress={applyCode}
                disabled={couponLoading || !couponInput.trim()}
                style={{
                  backgroundColor: "#1f1b4b", borderWidth: 1, borderColor: "#4c1d95",
                  borderRadius: 10, paddingHorizontal: 16, alignItems: "center", justifyContent: "center",
                  opacity: couponLoading || !couponInput.trim() ? 0.5 : 1,
                  marginTop: 2,
                }}
              >
                {couponLoading
                  ? <ActivityIndicator size="small" color="#a78bfa" />
                  : <Text style={{ color: "#a78bfa", fontWeight: "700", fontSize: 13 }}>Appliquer</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Payment method */}
        <View style={styles.paymentCard}>
          <View style={styles.paymentRow}>
            <View style={styles.paymentIconWrap}>
              <Ionicons name="card" size={22} color="#a78bfa" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentTitle}>Carte bancaire</Text>
              <Text style={styles.paymentSub}>Visa, Mastercard · Paiement sécurisé via Flouci</Text>
            </View>
            <Ionicons name="checkmark-circle" size={20} color="#a78bfa" />
          </View>
        </View>

        {/* Guarantees */}
        <View style={styles.guarantees}>
          {[
            { icon: "shield-checkmark-outline" as const, text: "Paiement 100% sécurisé SSL" },
            { icon: "flash-outline" as const, text: "Livraison instantanée après validation" },
            { icon: "lock-closed-outline" as const, text: "Données chiffrées et protégées" },
          ].map(({ icon, text }) => (
            <View key={text} style={styles.guaranteeRow}>
              <Ionicons name={icon} size={15} color="#4ade80" />
              <Text style={styles.guaranteeText}>{text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title={loading ? "Ouverture de Flouci…" : `Payer ${formatPrice(finalTotal)} · Carte`}
          onPress={handlePay}
          loading={loading}
          fullWidth
          size="lg"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d14" },
  scroll: { padding: 16, gap: 16 },
  card: {
    backgroundColor: "#12121f",
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#2d2d4e",
    padding: 18,
    gap: 14,
  },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  sectionSub: { color: "#6b7280", fontSize: 12, marginTop: -6 },
  summaryItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  summaryThumb: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: "#1a1a2e", alignItems: "center", justifyContent: "center",
  },
  summaryName: { color: "#e5e7eb", fontSize: 14, fontWeight: "600" },
  summaryMeta: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  summaryPrice: { color: "#fff", fontSize: 14, fontWeight: "700" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#2d2d4e" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { color: "#9ca3af", fontSize: 14, fontWeight: "600" },
  totalAmount: { color: "#fff", fontSize: 18, fontWeight: "800" },
  paymentCard: {
    backgroundColor: "#12121f", borderRadius: 18,
    borderWidth: 1, borderColor: "#4c1d95", padding: 18,
  },
  paymentRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  paymentIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "#1f1b4b", alignItems: "center", justifyContent: "center",
  },
  paymentTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  paymentSub: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  guarantees: { gap: 8 },
  guaranteeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  guaranteeText: { color: "#6b7280", fontSize: 12 },
  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#0d0d14",
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#2d2d4e",
    padding: 16,
  },
});
