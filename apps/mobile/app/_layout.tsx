import "../global.css";
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View, StyleSheet } from "react-native";
import { useAuthStore } from "@/store/auth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useOrderPolling } from "@/hooks/useOrderPolling";
import { NewOrderToast } from "@/components/admin/NewOrderToast";

const APP_BG = "#0d0d14";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function BackgroundServices() {
  usePushNotifications();
  useOrderPolling();
  return null;
}

function SafeAreaBackground() {
  const insets = useSafeAreaInsets();
  if (insets.bottom === 0) return null;
  return (
    <View style={{
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: insets.bottom,
      backgroundColor: APP_BG,
      zIndex: 1,
    }} />
  );
}

export default function RootLayout() {
  const refresh = useAuthStore((s) => s.refresh);

  useEffect(() => {
    refresh();
  }, []);

  return (
    // Fill the entire screen including areas behind system bars.
    <View style={styles.root}>
      {/* Transparent status bar — icons are light (white) on dark bg */}
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <GestureHandlerRootView style={styles.flex}>
        <SafeAreaProvider>
          <SafeAreaBackground />
          <QueryClientProvider client={queryClient}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: APP_BG },
                // iOS swipe-back + Android back gesture
                gestureEnabled: true,
                animation: Platform.OS === "ios" ? "default" : "fade",
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="(auth)"
                options={{ animation: "slide_from_bottom", presentation: "modal" }}
              />
              <Stack.Screen name="product/[slug]" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="checkout" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="order/[id]" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="order/list" options={{ animation: "slide_from_right" }} />
              <Stack.Screen
                name="order/success"
                options={{ animation: "fade", gestureEnabled: false }}
              />
              <Stack.Screen name="ticket/[id]" options={{ animation: "slide_from_right" }} />
              <Stack.Screen
                name="ticket/new"
                options={{ animation: "slide_from_bottom", presentation: "modal" }}
              />
              <Stack.Screen name="ticket/list" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="admin" options={{ animation: "slide_from_right" }} />
              <Stack.Screen name="support" options={{ animation: "slide_from_right" }} />
            </Stack>

            <BackgroundServices />
            <NewOrderToast />
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Extend behind both status bar (top) and nav bar (bottom) on Android.
  // On iOS this naturally fills the safe-area background.
  root: {
    flex: 1,
    backgroundColor: APP_BG,
  },
  flex: { flex: 1 },
});
