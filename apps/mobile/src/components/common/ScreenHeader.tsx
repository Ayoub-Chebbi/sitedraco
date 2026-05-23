import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, showBack, right }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        paddingHorizontal: 16,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Text style={{ color: Colors.purple[400], fontSize: 16, fontWeight: "500" }}>← Retour</Text>
          </TouchableOpacity>
        )}
        <Text style={{ color: "#f9fafb", fontSize: 18, fontWeight: "700" }}>{title}</Text>
      </View>
      {right && <View>{right}</View>}
    </View>
  );
}
