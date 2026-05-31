import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth";
import { getSiteSettings } from "@/api/products";

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signUp, loading } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: getSiteSettings,
    staleTime: 10 * 60_000,
  });

  const siteName = settings?.siteName || "LootStore";
  const logoUrl = settings?.logoUrl ?? null;

  async function handleRegister() {
    setError("");
    if (password.length < 8) { setError("Mot de passe trop court (min. 8 caractères)."); return; }
    try {
      await signUp(email, password, name);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message ?? "Une erreur s'est produite.");
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <LinearGradient colors={["#0d0010", "#0d0d14"]} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Close */}
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#9ca3af" />
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoBox}>
              {logoUrl ? (
                <Image
                  source={{ uri: logoUrl }}
                  style={{ width: 64, height: 64, borderRadius: 18 }}
                  contentFit="contain"
                />
              ) : (
                <LinearGradient colors={["#7c3aed", "#db2777"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoGradient}>
                  <Text style={styles.logoLetter}>{siteName.charAt(0).toUpperCase()}</Text>
                </LinearGradient>
              )}
            </View>
            <Text style={styles.appName}>{siteName.toUpperCase()}</Text>
            <Text style={styles.tagline}>Rejoignez la communauté</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error !== "" && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#f87171" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            <Input label="Nom" placeholder="Votre nom" value={name} onChangeText={setName} />
            <Input
              label="Email"
              placeholder="vous@exemple.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Input
              label="Mot de passe"
              placeholder="Min. 8 caractères"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Button title="Créer mon compte" onPress={handleRegister} loading={loading} fullWidth size="lg" />
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.divider} />
          </View>

          {/* Login */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Déjà un compte ?</Text>
            <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
              <Text style={styles.loginLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24, gap: 28 },
  closeBtn: {
    alignSelf: "flex-end",
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
  },
  logoSection: { alignItems: "center", gap: 10 },
  logoBox: {
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  logoGradient: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: { color: "#fff", fontSize: 30, fontWeight: "900" },
  appName: { color: "#fff", fontSize: 26, fontWeight: "900", letterSpacing: 2 },
  tagline: { color: "#6b7280", fontSize: 14 },
  form: { gap: 16 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#450a0a",
    borderWidth: 1,
    borderColor: "#7f1d1d",
    borderRadius: 12,
    padding: 12,
  },
  errorText: { color: "#f87171", fontSize: 13, flex: 1 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  divider: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: "#2d2d4e" },
  dividerText: { color: "#6b7280", fontSize: 13 },
  loginRow: { flexDirection: "row", justifyContent: "center", gap: 6 },
  loginText: { color: "#9ca3af", fontSize: 15 },
  loginLink: { color: "#a78bfa", fontSize: 15, fontWeight: "700" },
});
