import React, { useEffect, useRef } from "react";
import {
  Animated,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useNewOrderAlertStore } from "@/store/newOrderAlert";

const DISPLAY_MS = 6000;

export function NewOrderToast() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { alert, dismiss } = useNewOrderAlertStore();

  const translateY = useRef(new Animated.Value(-220)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!alert) {
      translateY.setValue(-220);
      return;
    }

    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 70,
      friction: 9,
    }).start();

    clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(handleDismiss, DISPLAY_MS);

    return () => clearTimeout(dismissTimer.current);
  }, [alert]);

  function handleDismiss() {
    Animated.timing(translateY, {
      toValue: -220,
      duration: 280,
      useNativeDriver: true,
    }).start(() => dismiss());
  }

  function handlePress() {
    handleDismiss();
    setTimeout(() => router.push("/admin/orders"), 150);
  }

  if (!alert) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 10, transform: [{ translateY }] },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.92}
        style={styles.card}
      >
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>💰</Text>
        </View>

        <View style={{ flex: 1, gap: 3 }}>
          <View style={styles.titleRow}>
            <Text style={styles.label}>Nouvelle commande</Text>
            <View style={styles.orderPill}>
              <Text style={styles.orderNumber}>#{alert.orderNumber}</Text>
            </View>
          </View>
          <Text style={styles.client} numberOfLines={1}>
            {alert.clientLabel}
          </Text>
          {!!alert.items && (
            <Text style={styles.items} numberOfLines={1}>
              {alert.items}
            </Text>
          )}
        </View>

        <View style={styles.amountWrap}>
          <Text style={styles.amount}>{alert.total.toFixed(2)}</Text>
          <Text style={styles.currency}>TND</Text>
        </View>

        <TouchableOpacity
          onPress={handleDismiss}
          style={styles.closeBtn}
          hitSlop={14}
        >
          <Ionicons name="close" size={13} color="#6b7280" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 99,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a0f2e",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#5b21b6",
    padding: 14,
    gap: 12,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 24,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#2e1065",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 24 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { color: "#c4b5fd", fontSize: 12, fontWeight: "700" },
  orderPill: {
    backgroundColor: "#2e1065",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  orderNumber: { color: "#fff", fontSize: 11, fontWeight: "700" },
  client: { color: "#f3f4f6", fontSize: 14, fontWeight: "700" },
  items: { color: "#9ca3af", fontSize: 11 },
  amountWrap: { alignItems: "flex-end" },
  amount: { color: "#4ade80", fontSize: 17, fontWeight: "800" },
  currency: { color: "#6b7280", fontSize: 10, fontWeight: "600" },
  closeBtn: { position: "absolute", top: 10, right: 10 },
});
