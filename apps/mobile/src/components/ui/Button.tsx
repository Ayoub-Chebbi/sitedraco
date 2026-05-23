import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const sizeStyles: Record<string, { py: number; px: number; fontSize: number; borderRadius: number }> = {
    sm: { py: 8, px: 14, fontSize: 13, borderRadius: 8 },
    md: { py: 12, px: 20, fontSize: 15, borderRadius: 10 },
    lg: { py: 16, px: 24, fontSize: 16, borderRadius: 12 },
  };
  const s = sizeStyles[size];

  if (variant === "primary") {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[{ borderRadius: s.borderRadius, overflow: "hidden", opacity: isDisabled ? 0.6 : 1 }, fullWidth && { width: "100%" }, style]}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={["#7c3aed", "#db2777"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingVertical: s.py, paddingHorizontal: s.px, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
        >
          {loading && <ActivityIndicator size="small" color="#fff" />}
          <Text style={[{ color: "#fff", fontWeight: "700", fontSize: s.fontSize }, textStyle]}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const outlineStyle: ViewStyle = {
    borderWidth: 1,
    borderColor: variant === "danger" ? "#f87171" : "#2d2d4e",
    paddingVertical: s.py,
    paddingHorizontal: s.px,
    borderRadius: s.borderRadius,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    opacity: isDisabled ? 0.6 : 1,
    backgroundColor: variant === "ghost" ? "transparent" : "#1a1a2e",
  } as ViewStyle;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[outlineStyle, fullWidth && { width: "100%" }, style]}
      activeOpacity={0.8}
    >
      {loading && <ActivityIndicator size="small" color="#9ca3af" />}
      <Text style={[{ color: variant === "danger" ? "#f87171" : "#e5e7eb", fontWeight: "600", fontSize: s.fontSize }, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
