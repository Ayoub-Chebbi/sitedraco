import React, { useState } from "react";
import { View, TextInput, Text, TextInputProps, TouchableOpacity } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export function Input({ label, error, rightIcon, onRightIconPress, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label && <Text style={{ color: "#d1d5db", fontSize: 13, fontWeight: "500" }}>{label}</Text>}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#1a1a2e",
          borderRadius: 10,
          borderWidth: 1,
          borderColor: error ? "#f87171" : focused ? "#7c3aed" : "#2d2d4e",
        }}
      >
        <TextInput
          {...props}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          style={[
            {
              flex: 1,
              paddingHorizontal: 14,
              paddingVertical: 12,
              color: "#f9fafb",
              fontSize: 15,
            },
            style,
          ]}
          placeholderTextColor="#4b5563"
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={{ paddingHorizontal: 12 }}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={{ color: "#f87171", fontSize: 12 }}>{error}</Text>}
    </View>
  );
}
