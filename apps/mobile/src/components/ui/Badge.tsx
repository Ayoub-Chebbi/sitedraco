import React from "react";
import { View, Text, ViewStyle } from "react-native";

interface BadgeProps {
  label: string;
  color?: string;
  bg?: string;
  size?: "sm" | "md";
}

export function Badge({ label, color = "#a78bfa", bg, size = "sm" }: BadgeProps) {
  return (
    <View
      style={{
        backgroundColor: bg ?? color + "22",
        borderRadius: 6,
        paddingHorizontal: size === "sm" ? 8 : 12,
        paddingVertical: size === "sm" ? 3 : 5,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ color, fontSize: size === "sm" ? 11 : 13, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}
