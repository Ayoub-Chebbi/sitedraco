import React, { useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createTicket } from "@/api/tickets";
import { useAuthStore } from "@/store/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/common/ScreenHeader";

const CATEGORIES = [
  { id: "order", label: "Commande", emoji: "📦" },
  { id: "payment", label: "Paiement", emoji: "💳" },
  { id: "technical", label: "Technique", emoji: "🔧" },
  { id: "general", label: "Général", emoji: "💬" },
];

export default function NewTicketScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0d0d14" }}>
        <ScreenHeader title="Nouveau ticket" showBack />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 }}>
          <Text style={{ fontSize: 48 }}>🔐</Text>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", textAlign: "center" }}>Connexion requise</Text>
          <Text style={{ color: "#9ca3af", fontSize: 14, textAlign: "center" }}>Vous devez être connecté pour ouvrir un ticket de support.</Text>
          <Button title="Se connecter" onPress={() => router.push("/(auth)/login")} fullWidth />
        </View>
      </View>
    );
  }

  async function handleSubmit() {
    if (!subject.trim() || !message.trim()) {
      Alert.alert("Champs manquants", "Le sujet et le message sont obligatoires.");
      return;
    }
    setLoading(true);
    try {
      const ticket = await createTicket(subject, message, category);
      router.replace(`/ticket/${ticket.id}`);
    } catch (e: any) {
      Alert.alert("Erreur", e.message ?? "Une erreur s'est produite.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScreenHeader title="Nouveau ticket" showBack />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16, gap: 20 }} keyboardShouldPersistTaps="handled">

        {/* Category */}
        <View style={{ gap: 10 }}>
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Catégorie</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 6,
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
                  borderWidth: 1,
                  backgroundColor: category === cat.id ? "#1a0533" : "#1a1a2e",
                  borderColor: category === cat.id ? "#7c3aed" : "#2d2d4e",
                }}
              >
                <Text style={{ fontSize: 16 }}>{cat.emoji}</Text>
                <Text style={{ color: category === cat.id ? "#a78bfa" : "#9ca3af", fontWeight: "600", fontSize: 13 }}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Subject */}
        <Input
          label="Sujet"
          placeholder="Décrivez brièvement votre problème"
          value={subject}
          onChangeText={setSubject}
        />

        {/* Message */}
        <Input
          label="Message"
          placeholder="Décrivez votre problème en détail…"
          value={message}
          onChangeText={setMessage}
          multiline
          style={{ minHeight: 120, textAlignVertical: "top" }}
        />

        <Button title="Envoyer le ticket" onPress={handleSubmit} loading={loading} fullWidth size="lg" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
