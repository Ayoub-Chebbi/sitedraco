import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { api } from "@/api/client";
import { formatPrice } from "@/utils/format";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/common/ScreenHeader";

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

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, total, clear } = useCartStore();
  const { user } = useAuthStore();

  const [email, setEmail] = useState(user?.email ?? "");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Holds the pending orderId while the user is on the Flouci payment page.
  const pendingRef = useRef<{ orderId: string; email: string } | null>(null);

  // Listen for the lootstore:// deep-link redirect from Flouci.
  useEffect(() => {
    const sub = Linking.addEventListener("url", async ({ url }) => {
      if (!pendingRef.current) return;
      if (!url.includes("checkout/success")) return;

      const { orderId, email: pendingEmail } = pendingRef.current;
      pendingRef.current = null;

      const params = parseQuery(url);
      const paymentId = params["payment_id"] ?? "";

      try {
        const { orderNumber } = await api.post<{ orderNumber: string }>(
          "/api/payment/flouci/verify",
          { orderId, paymentId }
        );
        clear();
        router.replace(
          `/order/success?orderNumber=${orderNumber}&email=${encodeURIComponent(pendingEmail)}`
        );
      } catch (err: any) {
        setLoading(false);
        Alert.alert(
          "Paiement non confirmé",
          err.message ?? "Contactez le support si vous avez été débité."
        );
      }
    });

    return () => sub.remove();
  }, []);

  async function handlePay() {
    setEmailError("");
    if (!email || !email.includes("@")) {
      setEmailError("Entrez un email valide.");
      return;
    }
    if (items.length === 0) {
      Alert.alert("Panier vide", "Ajoutez des produits avant de commander.");
      return;
    }

    setLoading(true);
    try {
      const { paymentUrl, orderId } = await api.post<{
        paymentUrl: string;
        orderId: string;
      }>("/api/mobile/payment/flouci/initiate", {
        email,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          unitPrice: i.product.discountPrice ?? i.product.price,
        })),
      });

      // Store orderId so the Linking listener can verify after redirect.
      pendingRef.current = { orderId, email };

      // Open the Flouci page in the system browser.
      // After payment, Flouci redirects to lootstore://checkout/success?...
      // which re-opens the app and fires the Linking event above.
      await Linking.openURL(paymentUrl);
    } catch (e: any) {
      setLoading(false);
      Alert.alert("Erreur", e.message ?? "Une erreur s'est produite. Réessayez.");
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenHeader title="Commander" showBack />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Order summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Récapitulatif</Text>
          {items.map((item) => {
            const price = item.product.discountPrice ?? item.product.price;
            return (
              <View key={item.product.id} style={styles.summaryItem}>
                <View style={styles.summaryThumb}>
                  <Text style={{ fontSize: 20 }}>🎮</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryName} numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.summaryMeta}>
                    ×{item.quantity} · {item.product.platform}
                  </Text>
                </View>
                <Text style={styles.summaryPrice}>
                  {formatPrice(price * item.quantity)}
                </Text>
              </View>
            );
          })}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total à payer</Text>
            <Text style={styles.totalAmount}>{formatPrice(total())}</Text>
          </View>
        </View>

        {/* Contact */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Email de réception</Text>
          <Text style={styles.sectionSub}>
            Votre clé de jeu sera envoyée à cette adresse
          </Text>
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

        {/* Flouci card payment */}
        <View style={styles.paymentCard}>
          <View style={styles.paymentRow}>
            <View style={styles.paymentIconWrap}>
              <Ionicons name="card" size={22} color="#a78bfa" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentTitle}>Carte bancaire</Text>
              <Text style={styles.paymentSub}>
                Visa, Mastercard · Paiement sécurisé via Flouci
              </Text>
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
          title={
            loading
              ? "Ouverture de Flouci…"
              : `Payer ${formatPrice(total())} · Carte`
          }
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
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryName: { color: "#e5e7eb", fontSize: 14, fontWeight: "500" },
  summaryMeta: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  summaryPrice: { color: "#a78bfa", fontWeight: "700", fontSize: 14 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#2d2d4e" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { color: "#fff", fontSize: 16, fontWeight: "700" },
  totalAmount: { color: "#a78bfa", fontSize: 22, fontWeight: "900" },
  paymentCard: {
    backgroundColor: "#1a0533",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#7c3aed",
    padding: 16,
  },
  paymentRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  paymentIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#2e1065",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  paymentSub: { color: "#9ca3af", fontSize: 12, marginTop: 2 },
  guarantees: {
    backgroundColor: "#052e16",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#166534",
    padding: 16,
    gap: 10,
  },
  guaranteeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  guaranteeText: { color: "#86efac", fontSize: 13 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#12121f",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#2d2d4e",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
});
