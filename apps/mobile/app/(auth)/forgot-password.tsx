import React, { useState } from "react";
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { forgotPassword } from "@/api/auth";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={["#2e1065", "#0d0d14"]} style={{ flex: 1, paddingTop: insets.top + 40, paddingHorizontal: 24, paddingBottom: 40, gap: 32 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: "#a78bfa", fontSize: 15 }}>← Retour</Text>
          </TouchableOpacity>

          <View style={{ alignItems: "center", gap: 8 }}>
            <Text style={{ color: "#fff", fontSize: 26, fontWeight: "900" }}>Mot de passe oublié</Text>
            <Text style={{ color: "#9ca3af", fontSize: 14, textAlign: "center" }}>
              {sent ? "Vérifiez votre boîte mail." : "Entrez votre email pour recevoir un lien de réinitialisation."}
            </Text>
          </View>

          {sent ? (
            <View style={{ backgroundColor: "#052e16", borderWidth: 1, borderColor: "#166534", borderRadius: 12, padding: 20, alignItems: "center", gap: 10 }}>
              <Text style={{ fontSize: 32 }}>✉️</Text>
              <Text style={{ color: "#4ade80", fontSize: 15, fontWeight: "600", textAlign: "center" }}>
                Si un compte existe avec cet email, vous recevrez un lien dans quelques minutes.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              <Input label="Email" placeholder="vous@exemple.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <Button title="Envoyer le lien" onPress={handleSubmit} loading={loading} fullWidth />
            </View>
          )}
        </LinearGradient>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
