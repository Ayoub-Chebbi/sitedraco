import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth";

export default function OrderPendingScreen() {
  const { orderNumber } = useLocalSearchParams<{ orderNumber: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  function handleTrack() {
    if (!user) {
      router.push("/(auth)/login");
    } else {
      router.push(`/order/${orderNumber}`);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      {/* Icon */}
      <View style={styles.iconWrap}>
        <Ionicons name="time-outline" size={48} color="#f59e0b" />
      </View>

      <Text style={styles.title}>Commande reçue !</Text>
      <Text style={styles.orderNum}>{orderNumber}</Text>

      <View style={styles.infoBox}>
        <Ionicons name="time-outline" size={16} color="#fbbf24" />
        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitle}>En attente de vérification</Text>
          <Text style={styles.infoText}>
            Notre équipe va vérifier votre justificatif. Votre clé sera envoyée par email entre{" "}
            <Text style={{ color: "#fff", fontWeight: "700" }}>1h et 24h</Text> après confirmation.
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={handleTrack}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>Suivre ma commande</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          style={styles.secondaryBtn}
        >
          <Text style={styles.secondaryBtnText}>Retour à la boutique</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: "#0d0d14",
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 28, gap: 20,
  },
  iconWrap: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: "#451a03",
    borderWidth: 1, borderColor: "#92400e",
    alignItems: "center", justifyContent: "center",
    marginBottom: 8,
  },
  title: { color: "#fff", fontSize: 26, fontWeight: "900", textAlign: "center" },
  orderNum: { color: "#a78bfa", fontSize: 18, fontWeight: "800", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  infoBox: {
    flexDirection: "row", gap: 12, alignItems: "flex-start",
    backgroundColor: "#451a0330",
    borderWidth: 1, borderColor: "#92400e50",
    borderRadius: 16, padding: 16, width: "100%",
  },
  infoTitle: { color: "#fbbf24", fontSize: 14, fontWeight: "700", marginBottom: 4 },
  infoText: { color: "#9ca3af", fontSize: 13, lineHeight: 19 },
  actions: { width: "100%", gap: 10, marginTop: 8 },
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#7c3aed", borderRadius: 16, paddingVertical: 16,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  secondaryBtn: {
    alignItems: "center", paddingVertical: 14,
    borderRadius: 16, borderWidth: 1, borderColor: "#2d2d4e",
    backgroundColor: "#12121f",
  },
  secondaryBtnText: { color: "#9ca3af", fontSize: 15, fontWeight: "600" },
});
