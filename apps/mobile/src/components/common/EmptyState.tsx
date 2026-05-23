import React from "react";
import { View, Text } from "react-native";

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ emoji = "📭", title, description, action }: EmptyStateProps) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
      <Text style={{ fontSize: 48 }}>{emoji}</Text>
      <Text style={{ color: "#f9fafb", fontSize: 18, fontWeight: "700", textAlign: "center" }}>{title}</Text>
      {description && <Text style={{ color: "#9ca3af", fontSize: 14, textAlign: "center", lineHeight: 20 }}>{description}</Text>}
      {action && <View style={{ marginTop: 8 }}>{action}</View>}
    </View>
  );
}
