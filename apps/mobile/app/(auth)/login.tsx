import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, loading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!email || !password) { setError("Remplissez tous les champs."); return; }
    setError("");
    try {
      await signIn(email.toLowerCase().trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message ?? "Email ou mot de passe incorrect.");
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
            <LinearGradient colors={["#7c3aed", "#db2777"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoBox}>
              <Text style={styles.logoLetter}>L</Text>
            </LinearGradient>
            <Text style={styles.appName}>LOOTSTORE</Text>
            <Text style={styles.tagline}>Connectez-vous à votre compte</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error !== "" && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#f87171" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

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
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
              rightIcon={
                <Ionicons name={showPwd ? "eye-off-outline" : "eye-outline"} size={18} color="#6b7280" />
              }
              onRightIconPress={() => setShowPwd(!showPwd)}
            />

            <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")} style={{ alignSelf: "flex-end" }}>
              <Text style={styles.forgotLink}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            <Button title="Se connecter" onPress={handleLogin} loading={loading} fullWidth size="lg" />
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.divider} />
          </View>

          {/* Register */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Pas encore de compte ?</Text>
            <TouchableOpacity onPress={() => router.replace("/(auth)/register")}>
              <Text style={styles.registerLink}>Créer un compte</Text>
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
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
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
  forgotLink: { color: "#a78bfa", fontSize: 13, fontWeight: "600" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  divider: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: "#2d2d4e" },
  dividerText: { color: "#6b7280", fontSize: 13 },
  registerRow: { flexDirection: "row", justifyContent: "center", gap: 6 },
  registerText: { color: "#9ca3af", fontSize: 15 },
  registerLink: { color: "#a78bfa", fontSize: 15, fontWeight: "700" },
});
