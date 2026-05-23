import React from "react";
import { ScrollView, TouchableOpacity, Text, View } from "react-native";
import { useRouter } from "expo-router";

const CATEGORIES = [
  { label: "PlayStation", emoji: "🎮", platform: "PlayStation" },
  { label: "Xbox", emoji: "🟩", platform: "Xbox" },
  { label: "PC / Steam", emoji: "💻", platform: "PC" },
  { label: "Nintendo", emoji: "🔴", platform: "Nintendo" },
  { label: "Mobile", emoji: "📱", platform: "Mobile" },
  { label: "Gift Cards", emoji: "🎁", platform: "Gift Cards" },
];

export function CategoryStrip() {
  const router = useRouter();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
      {CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat.platform}
          onPress={() => router.push(`/(tabs)/products?platform=${encodeURIComponent(cat.platform)}` as any)}
          style={{
            backgroundColor: "#1a1a2e",
            borderWidth: 1,
            borderColor: "#2d2d4e",
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 10,
            alignItems: "center",
            gap: 4,
            minWidth: 80,
          }}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 22 }}>{cat.emoji}</Text>
          <Text style={{ color: "#d1d5db", fontSize: 11, fontWeight: "600", textAlign: "center" }}>{cat.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
