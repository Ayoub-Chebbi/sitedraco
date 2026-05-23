import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

interface SectionHeaderProps {
  title: string;
  linkHref?: string;
  linkLabel?: string;
}

export function SectionHeader({ title, linkHref, linkLabel = "Voir tout" }: SectionHeaderProps) {
  const router = useRouter();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ width: 3, height: 20, backgroundColor: "#7c3aed", borderRadius: 2 }} />
        <Text style={{ color: "#f9fafb", fontSize: 18, fontWeight: "800" }}>{title}</Text>
      </View>
      {linkHref && (
        <TouchableOpacity onPress={() => router.push(linkHref as any)}>
          <Text style={{ color: "#a78bfa", fontSize: 13, fontWeight: "600" }}>{linkLabel} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
