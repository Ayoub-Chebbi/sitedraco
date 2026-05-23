import React from "react";
import { View, ActivityIndicator, Text } from "react-native";

export function LoadingSpinner({ message }: { message?: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0d0d14", gap: 12 }}>
      <ActivityIndicator size="large" color="#7c3aed" />
      {message && <Text style={{ color: "#9ca3af", fontSize: 14 }}>{message}</Text>}
    </View>
  );
}
