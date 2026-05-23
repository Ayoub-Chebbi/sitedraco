import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/Button";

export default function OrderSuccessScreen() {
  const { orderNumber, email } = useLocalSearchParams<{ orderNumber: string; email: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();

  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={["#052e16", "#0d0d14"]}
      style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
    >
      {/* Animated checkmark */}
      <Animated.View style={[styles.iconWrap, { transform: [{ scale }], opacity }]}>
        <View style={styles.iconOuter}>
          <View style={styles.iconInner}>
            <Ionicons name="checkmark" size={52} color="#fff" />
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.content, { opacity }]}>
        <Text style={styles.title}>Commande confirmée !</Text>
        <Text style={styles.subtitle}>Merci pour votre achat 🎉</Text>

        {/* Order number */}
        <View style={styles.orderCard}>
          <Text style={styles.orderLabel}>Numéro de commande</Text>
          <Text style={styles.orderNumber}>#{orderNumber}</Text>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          {[
            {
              icon: "mail-outline" as const,
              title: "Confirmation envoyée",
              desc: `Un email a été envoyé à ${email}`,
            },
            {
              icon: "flash-outline" as const,
              title: "Livraison instantanée",
              desc: "Vos clés seront disponibles après validation du paiement",
            },
            {
              icon: "headset-outline" as const,
              title: "Besoin d'aide ?",
              desc: "Notre support est disponible 7j/7",
            },
          ].map(({ icon, title, desc }) => (
            <View key={title} style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name={icon} size={18} color="#4ade80" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>{title}</Text>
                <Text style={styles.infoDesc}>{desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {user && (
            <Button
              title="Voir ma commande"
              onPress={() => router.push(`/order/${orderNumber}`)}
              fullWidth
              size="lg"
            />
          )}
          <Button
            title="Retour à l'accueil"
            variant="outline"
            onPress={() => router.replace("/(tabs)")}
            fullWidth
            size="lg"
          />
          <TouchableOpacity onPress={() => router.push("/ticket/new")}>
            <Text style={styles.supportLink}>
              <Ionicons name="chatbubble-outline" size={13} /> Contacter le support
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, alignItems: "center", justifyContent: "center", gap: 28 },
  iconWrap: { alignItems: "center" },
  iconOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(74,222,128,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { alignItems: "center", width: "100%", gap: 20 },
  title: { color: "#fff", fontSize: 28, fontWeight: "900", textAlign: "center" },
  subtitle: { color: "#9ca3af", fontSize: 16, textAlign: "center", marginTop: -12 },
  orderCard: {
    backgroundColor: "#12121f",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#166534",
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    width: "100%",
    gap: 4,
  },
  orderLabel: { color: "#6b7280", fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  orderNumber: { color: "#4ade80", fontSize: 24, fontWeight: "900", letterSpacing: 1 },
  infoCard: {
    backgroundColor: "#12121f",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#2d2d4e",
    padding: 16,
    width: "100%",
    gap: 14,
  },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#052e16",
    alignItems: "center",
    justifyContent: "center",
  },
  infoTitle: { color: "#e5e7eb", fontSize: 13, fontWeight: "600" },
  infoDesc: { color: "#6b7280", fontSize: 12, marginTop: 2, lineHeight: 17 },
  actions: { width: "100%", gap: 10 },
  supportLink: {
    color: "#6b7280",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },
});
