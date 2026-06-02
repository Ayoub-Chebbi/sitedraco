import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, KeyboardAvoidingView, Platform,
  Alert, StyleSheet, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
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
import { API_BASE_URL } from "@/constants/config";
import type { CouponResult } from "@/types";

type PaymentMethod = "carte" | "d17" | "flouci_app" | "virement";

const PAYMENT_METHODS: {
  id: PaymentMethod; label: string; desc: string;
  icon: keyof typeof Ionicons.glyphMap; color: string; needsProof: boolean;
}[] = [
  { id: "carte",      label: "Carte bancaire",   desc: "Visa, Mastercard · Flouci",          icon: "card-outline",           color: "#7c3aed", needsProof: false },
  { id: "d17",        label: "D17",              desc: "56 190 577 · 96 780 440",            icon: "phone-portrait-outline", color: "#3b82f6", needsProof: true  },
  { id: "flouci_app", label: "Flouci (app)",     desc: "58 960 645",                         icon: "phone-portrait-outline", color: "#10b981", needsProof: true  },
  { id: "virement",   label: "Virement bancaire",desc: "RIB : 24 031 201 5632 512201 69",   icon: "business-outline",       color: "#f59e0b", needsProof: true  },
];

function ManualDetails({ method }: { method: PaymentMethod }) {
  const configs = {
    d17:        { color: "#93c5fd", bg: "#0f1e3d44", border: "#3b82f633", title: "Envoyez le montant via D17 à :", accounts: [["56 190 577","56190577"],["96 780 440","96780440"]] },
    flouci_app: { color: "#6ee7b7", bg: "#052e1644", border: "#10b98133", title: "Envoyez le montant via Flouci à :", accounts: [["58 960 645","58960645"]] },
    virement:   { color: "#fcd34d", bg: "#451a0344", border: "#f59e0b33", title: "Effectuez un virement vers :", accounts: null },
  } as const;

  if (method === "carte") return null;
  const cfg = configs[method];

  return (
    <View style={[styles.detailsBox, { borderColor: cfg.border, backgroundColor: cfg.bg }]}>
      <Text style={[styles.detailsTitle, { color: cfg.color }]}>{cfg.title}</Text>
      {cfg.accounts ? (
        cfg.accounts.map(([disp, val]) => (
          <View key={val} style={styles.accountRow}>
            <Text style={styles.accountNumber}>{disp}</Text>
          </View>
        ))
      ) : (
        <View style={{ gap: 8 }}>
          <View>
            <Text style={styles.detailsLabel}>RIB</Text>
            <View style={styles.accountRow}>
              <Text style={styles.accountNumber}>24 031 201 5632 512201 69</Text>
            </View>
          </View>
          <View>
            <Text style={styles.detailsLabel}>Bénéficiaire</Text>
            <Text style={[styles.accountNumber, { fontSize: 15 }]}>Trakioo</Text>
          </View>
        </View>
      )}
      <Text style={styles.detailsNote}>Après le transfert, téléchargez votre justificatif ci-dessous.</Text>
    </View>
  );
}

function itemPrice(item: ReturnType<typeof useCartStore.getState>["items"][0]) {
  if (item.variantPrice !== undefined) return item.variantPrice;
  if (item.variant === "account") return item.product.accountDiscountPrice ?? item.product.accountPrice ?? item.product.price;
  return item.product.discountPrice ?? item.product.price;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, total, clear } = useCartStore();
  const { user } = useAuthStore();

  const [email, setEmail] = useState(user?.email ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("carte");
  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === paymentMethod)!;

  const needsSteam = items.some((i) => i.product.requiresSteamUsername);
  const [steamUsername, setSteamUsername] = useState("");

  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null);

  const [proofUri, setProofUri] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  const subtotal = total();
  const discount = appliedCoupon?.discount ?? 0;
  const finalTotal = Math.max(0, subtotal - discount);

  const pendingRef = useRef<{ orderId: string; email: string; paymentId: string } | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function pollPaymentStatus() {
    if (!pendingRef.current) return;
    const { orderId, email: pendingEmail, paymentId } = pendingRef.current;
    try {
      const { orderNumber } = await api.post<{ orderNumber: string }>("/api/payment/flouci/verify", { orderId, paymentId });
      pendingRef.current = null;
      if (pollRef.current) clearInterval(pollRef.current);
      setLoading(false);
      clear();
      router.replace(`/order/success?orderNumber=${orderNumber}&email=${encodeURIComponent(pendingEmail)}`);
    } catch { /* still pending */ }
  }

  async function applyCode() {
    if (!couponInput.trim()) return;
    setCouponError("");
    setCouponLoading(true);
    try {
      const result = await api.post<CouponResult>("/api/coupons/validate", { code: couponInput.trim(), amount: subtotal });
      setAppliedCoupon(result);
      setCouponInput("");
    } catch (err: any) {
      setCouponError(err.message ?? "Code invalide.");
    } finally {
      setCouponLoading(false);
    }
  }

  async function pickProof() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "Autorisez l'accès à votre galerie pour envoyer un justificatif.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) setProofUri(result.assets[0].uri);
  }

  async function uploadProof(): Promise<string> {
    if (!proofUri) throw new Error("Aucun justificatif sélectionné.");
    setUploadingProof(true);
    const filename = proofUri.split("/").pop() ?? "proof.jpg";
    const ext = filename.split(".").pop() ?? "jpg";
    const form = new FormData();
    form.append("file", { uri: proofUri, name: filename, type: `image/${ext}` } as any);
    const res = await fetch(`${API_BASE_URL}/api/payment/proof`, { method: "POST", body: form });
    setUploadingProof(false);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Échec de l'upload.");
    return data.url;
  }

  async function handlePay() {
    setError("");
    if (!email || !email.includes("@")) { setError("Entrez un email valide."); return; }
    if (needsSteam && !steamUsername.trim()) { setError("Veuillez entrer votre pseudo Steam."); return; }
    if (selectedMethod.needsProof && !proofUri) { setError("Téléchargez le justificatif de paiement."); return; }
    if (items.length === 0) return;

    setLoading(true);
    try {
      if (paymentMethod === "carte") {
        const { paymentUrl, orderId, paymentId } = await api.post<{ paymentUrl: string; orderId: string; paymentId: string }>(
          "/api/mobile/payment/flouci/initiate",
          {
            email,
            items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity, ...(i.variantId && { variantId: i.variantId }) })),
            ...(appliedCoupon && { couponCode: appliedCoupon.code }),
            ...(needsSteam && steamUsername.trim() && { steamUsername: steamUsername.trim() }),
          }
        );
        pendingRef.current = { orderId, email, paymentId };
        await WebBrowser.openBrowserAsync(paymentUrl);
        let pollCount = 0;
        pollRef.current = setInterval(() => {
          if (++pollCount > 100) {
            if (pollRef.current) clearInterval(pollRef.current);
            setLoading(false);
            Alert.alert("Vérification", "Vérifiez votre email pour le statut du paiement.");
            return;
          }
          pollPaymentStatus();
        }, 3000);
      } else {
        const proofUrl = await uploadProof();
        const data = await api.post<{ orderNumber: string }>("/api/payment/manual", {
          email,
          paymentMethod,
          paymentProofUrl: proofUrl,
          items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity, ...(i.variantId && { variantId: i.variantId }) })),
          ...(appliedCoupon && { couponCode: appliedCoupon.code }),
          ...(needsSteam && steamUsername.trim() && { steamUsername: steamUsername.trim() }),
        });
        clear();
        setLoading(false);
        router.replace(`/order/pending?orderNumber=${data.orderNumber}`);
      }
    } catch (e: any) {
      setLoading(false);
      setError(e.message ?? "Une erreur s'est produite. Réessayez.");
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScreenHeader title="Paiement" showBack />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 140 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Order summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="bag-outline" size={16} color="#a78bfa" />
            <Text style={styles.cardTitle}>Récapitulatif</Text>
          </View>
          {items.map((item, idx) => {
            const price = itemPrice(item);
            return (
              <View key={idx} style={styles.summaryItem}>
                <View style={styles.summaryThumb}>
                  {item.product.imageUrl
                    ? <Image source={{ uri: item.product.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    : <Text style={{ fontSize: 18 }}>🎮</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryName} numberOfLines={1}>
                    {item.variantName ? `${item.product.name} — ${item.variantName}` : item.product.name}
                  </Text>
                  <Text style={styles.summaryMeta}>×{item.quantity} · {item.product.platform}</Text>
                </View>
                <Text style={styles.summaryPrice}>{formatPrice(price * item.quantity)}</Text>
              </View>
            );
          })}
          <View style={styles.divider} />
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Sous-total</Text><Text style={styles.totalValue}>{formatPrice(subtotal)}</Text></View>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Livraison</Text><Text style={[styles.totalValue, { color: "#4ade80" }]}>Gratuite</Text></View>
          {discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={{ color: "#4ade80", fontSize: 13 }}>🏷️ {appliedCoupon?.code}</Text>
              <Text style={{ color: "#4ade80", fontSize: 13, fontWeight: "700" }}>-{formatPrice(discount)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalAmount}>{formatPrice(finalTotal)}</Text>
          </View>
        </View>

        {/* Step 1 — Email */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepNum}>1</Text></View>
            <Text style={styles.cardTitle}>Coordonnées</Text>
          </View>
          <Input label="Email de réception" placeholder="vous@exemple.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          {!user && (
            <View style={styles.infoNote}>
              <Ionicons name="information-circle-outline" size={13} color="#6b7280" />
              <Text style={styles.infoNoteText}>Votre clé sera envoyée à cet email après confirmation.</Text>
            </View>
          )}
        </View>

        {/* Steam */}
        {needsSteam && (
          <View style={[styles.card, { borderColor: "#1d4ed8" }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="logo-steam" size={16} color="#60a5fa" />
              <Text style={[styles.cardTitle, { color: "#93c5fd" }]}>Pseudo Steam requis</Text>
            </View>
            <Input label="Pseudo Steam" placeholder="VotrePseudoSteam" value={steamUsername} onChangeText={setSteamUsername} autoCapitalize="none" autoCorrect={false} />
          </View>
        )}

        {/* Step 2 — Coupon */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepNum}>2</Text></View>
            <Text style={styles.cardTitle}>Code promo</Text>
            <Text style={styles.optionalTag}>optionnel</Text>
          </View>
          {appliedCoupon ? (
            <View style={styles.couponApplied}>
              <Ionicons name="checkmark-circle" size={18} color="#4ade80" />
              <View style={{ flex: 1 }}>
                <Text style={styles.couponCode}>{appliedCoupon.code}</Text>
                <Text style={styles.couponMeta}>
                  {appliedCoupon.type === "percentage" ? `${appliedCoupon.value}%` : formatPrice(appliedCoupon.value)} de réduction
                  {" · "}<Text style={{ color: "#4ade80" }}>-{formatPrice(appliedCoupon.discount)}</Text>
                </Text>
              </View>
              <TouchableOpacity onPress={() => { setAppliedCoupon(null); setCouponError(""); }} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponRow}>
              <View style={{ flex: 1 }}>
                <Input placeholder="Ex : PROMO20" value={couponInput} onChangeText={(t) => { setCouponInput(t.toUpperCase()); setCouponError(""); }} onSubmitEditing={applyCode} autoCapitalize="characters" autoCorrect={false} error={couponError} />
              </View>
              <TouchableOpacity onPress={applyCode} disabled={couponLoading || !couponInput.trim()} style={[styles.applyBtn, (!couponInput.trim() || couponLoading) && { opacity: 0.5 }]}>
                {couponLoading ? <ActivityIndicator size="small" color="#a78bfa" /> : <Text style={styles.applyBtnText}>Appliquer</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Step 3 — Payment */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepNum}>3</Text></View>
            <Text style={styles.cardTitle}>Mode de paiement</Text>
          </View>

          <View style={styles.methodGrid}>
            {PAYMENT_METHODS.map((m) => {
              const active = paymentMethod === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => { setPaymentMethod(m.id); setProofUri(null); setError(""); }}
                  style={[styles.methodCard, active && { borderColor: m.color, backgroundColor: `${m.color}18` }]}
                  activeOpacity={0.75}
                >
                  <View style={styles.methodCardTop}>
                    <View style={[styles.methodIcon, { backgroundColor: active ? `${m.color}30` : "#1a1a2e" }]}>
                      <Ionicons name={m.icon} size={18} color={active ? m.color : "#6b7280"} />
                    </View>
                    <View style={[styles.radioCircle, active && { borderColor: m.color, backgroundColor: m.color }]} />
                  </View>
                  <Text style={[styles.methodLabel, active && { color: "#fff" }]}>{m.label}</Text>
                  <Text style={styles.methodDesc} numberOfLines={2}>{m.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedMethod.needsProof && (
            <>
              <ManualDetails method={paymentMethod} />

              <TouchableOpacity onPress={pickProof} style={[styles.uploadZone, proofUri && styles.uploadZoneFilled]} activeOpacity={0.75}>
                {proofUri ? (
                  <View style={{ alignItems: "center", gap: 10 }}>
                    <Image source={{ uri: proofUri }} style={styles.proofPreview} contentFit="contain" borderRadius={12} />
                    <View style={styles.uploadedBadge}>
                      <Ionicons name="checkmark-circle" size={15} color="#4ade80" />
                      <Text style={styles.uploadedText}>Justificatif sélectionné</Text>
                    </View>
                    <Text style={styles.changePhotoText}>Appuyer pour changer</Text>
                  </View>
                ) : (
                  <View style={{ alignItems: "center", gap: 8 }}>
                    <View style={styles.uploadIconWrap}>
                      <Ionicons name="cloud-upload-outline" size={28} color="#6b7280" />
                    </View>
                    <Text style={styles.uploadTitle}>Télécharger le justificatif</Text>
                    <Text style={styles.uploadSub}>Appuyez pour choisir une image</Text>
                    <Text style={styles.uploadFormats}>JPG, PNG, WebP · max 10 Mo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </>
          )}

          {error !== "" && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={15} color="#f87171" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {paymentMethod !== "carte" && (
            <Text style={styles.manualNote}>Commande activée après vérification du justificatif (1h–24h).</Text>
          )}

          <View style={styles.trustRow}>
            {([
              { icon: "shield-checkmark-outline", text: "SSL sécurisé" },
              { icon: "flash-outline", text: "1h–24h" },
              { icon: "lock-closed-outline", text: "Chiffré" },
            ] as const).map(({ icon, text }) => (
              <View key={text} style={styles.trustItem}>
                <Ionicons name={icon} size={12} color="#4ade80" />
                <Text style={styles.trustText}>{text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          title={
            loading || uploadingProof
              ? (uploadingProof ? "Upload…" : paymentMethod === "carte" ? "Ouverture du paiement…" : "Envoi de la commande…")
              : paymentMethod === "carte"
              ? `Payer ${formatPrice(finalTotal)} · Carte`
              : `Confirmer — ${formatPrice(finalTotal)}`
          }
          onPress={handlePay}
          loading={loading || uploadingProof}
          disabled={loading || uploadingProof || (selectedMethod.needsProof && !proofUri)}
          fullWidth
          size="lg"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d14" },
  scroll: { padding: 16, gap: 14 },

  card: {
    backgroundColor: "#12121f", borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth, borderColor: "#2d2d4e",
    padding: 16, gap: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  optionalTag: { color: "#4b5563", fontSize: 11, marginLeft: "auto" },

  stepBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#7c3aed", alignItems: "center", justifyContent: "center" },
  stepNum: { color: "#fff", fontSize: 11, fontWeight: "800" },

  infoNote: { flexDirection: "row", alignItems: "flex-start", gap: 6, backgroundColor: "#1a1a2e", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "#2d2d4e" },
  infoNoteText: { color: "#6b7280", fontSize: 12, flex: 1, lineHeight: 17 },

  summaryItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  summaryThumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: "#1a1a2e", overflow: "hidden", alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: "#2d2d4e" },
  summaryName: { color: "#e5e7eb", fontSize: 13, fontWeight: "600" },
  summaryMeta: { color: "#6b7280", fontSize: 11, marginTop: 2 },
  summaryPrice: { color: "#fff", fontSize: 13, fontWeight: "700" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#2d2d4e" },
  totalRow: { flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { color: "#6b7280", fontSize: 13 },
  totalValue: { color: "#e5e7eb", fontSize: 13, fontWeight: "600" },
  grandTotalRow: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#2d2d4e", paddingTop: 10, marginTop: 2 },
  grandTotalLabel: { color: "#fff", fontSize: 16, fontWeight: "800" },
  grandTotalAmount: { color: "#a78bfa", fontSize: 20, fontWeight: "900" },

  couponApplied: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#052e16", borderWidth: 1, borderColor: "#15803d", borderRadius: 12, padding: 12 },
  couponCode: { color: "#4ade80", fontWeight: "700", fontSize: 14 },
  couponMeta: { color: "#6b7280", fontSize: 12, marginTop: 1 },
  couponRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  applyBtn: { backgroundColor: "#1f1b4b", borderWidth: 1, borderColor: "#4c1d95", borderRadius: 12, paddingHorizontal: 16, height: 48, alignItems: "center", justifyContent: "center", marginTop: 2 },
  applyBtnText: { color: "#a78bfa", fontWeight: "700", fontSize: 13 },

  methodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  methodCard: { width: "47%", borderRadius: 14, borderWidth: 1, borderColor: "#2d2d4e", backgroundColor: "#0d0d14", padding: 12, gap: 6 },
  methodCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  methodIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  radioCircle: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: "#4b5563" },
  methodLabel: { color: "#9ca3af", fontSize: 13, fontWeight: "700" },
  methodDesc: { color: "#4b5563", fontSize: 10, lineHeight: 13 },

  detailsBox: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 },
  detailsTitle: { fontSize: 13, fontWeight: "700" },
  detailsLabel: { color: "#6b7280", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
  accountRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  accountNumber: { color: "#fff", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 14, letterSpacing: 1 },
  detailsNote: { color: "#6b7280", fontSize: 11, lineHeight: 16 },

  uploadZone: { borderWidth: 2, borderStyle: "dashed", borderColor: "#2d2d4e", borderRadius: 16, padding: 24, alignItems: "center", backgroundColor: "#0d0d14" },
  uploadZoneFilled: { borderColor: "#15803d", backgroundColor: "#052e1618" },
  uploadIconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: "#1a1a2e", borderWidth: 1, borderColor: "#2d2d4e", alignItems: "center", justifyContent: "center" },
  uploadTitle: { color: "#e5e7eb", fontSize: 14, fontWeight: "700" },
  uploadSub: { color: "#6b7280", fontSize: 12 },
  uploadFormats: { color: "#4b5563", fontSize: 11 },
  proofPreview: { width: "100%", height: 160 },
  uploadedBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
  uploadedText: { color: "#4ade80", fontSize: 13, fontWeight: "700" },
  changePhotoText: { color: "#6b7280", fontSize: 11 },

  errorBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#450a0a", borderWidth: 1, borderColor: "#7f1d1d", borderRadius: 12, padding: 12 },
  errorText: { color: "#f87171", fontSize: 13, flex: 1, lineHeight: 18 },
  manualNote: { color: "#6b7280", fontSize: 11, textAlign: "center", lineHeight: 16 },

  trustRow: { flexDirection: "row", gap: 6 },
  trustItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#0d0d14", borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: "#2d2d4e", paddingVertical: 6, paddingHorizontal: 8 },
  trustText: { color: "#6b7280", fontSize: 10 },

  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#0d0d14", borderTopWidth: 1, borderTopColor: "#1f1f35", padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 20 },
});
