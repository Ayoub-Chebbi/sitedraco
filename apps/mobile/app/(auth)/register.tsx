import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth";

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signUp, loading } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={["#2e1065", "#0d0d14"]} style={{ paddingTop: insets.top + 40, paddingHorizontal: 24, paddingBottom: 40, gap: 32 }}>
          <View style={{ alignItems: "center", gap: 8 }}>
            <Text style={{ color: "#fff", fontSize: 26, fontWeight: "900" }}>Créer un compte</Text>
            <Text style={{ color: "#9ca3af", fontSize: 14, textAlign: "center" }}>Rejoignez la communauté LootStore</Text>
          </View>

          <View style={{ gap: 16 }}>
            {error !== "" && (
              <View style={{ backgroundColor: "#450a0a", borderWidth: 1, borderColor: "#7f1d1d", borderRadius: 10, padding: 12 }}>
                <Text style={{ color: "#f87171", fontSize: 13 }}>{error}</Text>
              </View>
            )}
            <Input label="Nom" placeholder="Votre nom" value={name} onChangeText={setName} />
            <Input label="Email" placeholder="vous@exemple.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Input label="Mot de passe" placeholder="Min. 8 caractères" value={password} onChangeText={setPassword} secureTextEntry />
            <Button title="Créer mon compte" onPress={handleRegister} loading={loading} fullWidth />
          </View>

          <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
            <Text style={{ color: "#9ca3af", fontSize: 14 }}>Déjà un compte ?</Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text style={{ color: "#a78bfa", fontSize: 14, fontWeight: "600" }}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
