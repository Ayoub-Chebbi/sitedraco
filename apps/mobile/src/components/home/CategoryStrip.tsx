import React from "react";
import { ScrollView, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getPlatforms } from "@/api/products";

export function CategoryStrip() {
  const router = useRouter();
  const { data: platforms, isLoading } = useQuery({
    queryKey: ["platforms"],
    queryFn: getPlatforms,
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return <ActivityIndicator color="#7c3aed" style={{ marginVertical: 20 }} />;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
      {(platforms ?? []).map((platform) => (
        <TouchableOpacity
          key={platform.value}
          onPress={() => router.push(`/(tabs)/products?platform=${encodeURIComponent(platform.value)}` as any)}
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
          <Text style={{ fontSize: 22 }}>{platform.emoji}</Text>
          <Text style={{ color: "#d1d5db", fontSize: 11, fontWeight: "600", textAlign: "center" }}>{platform.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
