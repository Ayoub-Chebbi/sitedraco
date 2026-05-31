import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import type { Subscription } from "expo-notifications";
import { useAuthStore } from "@/store/auth";
import { api } from "@/api/client";
import { Notifications } from "@/lib/notifications";

async function registerForPushNotifications(): Promise<string | null> {
  if (!Notifications) {
    console.log("[push] Notifications module not available (Expo Go)");
    return null;
  }
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.warn("[push] Notification permission denied:", finalStatus);
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("new-orders", {
        name: "Nouvelles commandes",
        importance: Notifications.AndroidImportance.MAX,
        sound: "ching.wav",
        vibrationPattern: [0, 250, 100, 250],
        lightColor: "#a78bfa",
      });
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    console.log("[push] Getting push token, projectId:", projectId);

    const result = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    console.log("[push] Token obtained:", result.data.slice(0, 30) + "…");
    return result.data;
  } catch (err) {
    console.error("[push] Registration failed:", err);
    return null;
  }
}

async function savePushToken(token: string) {
  try {
    await api.patch("/api/mobile/auth/push-token", { token });
    console.log("[push] Token saved to server");
  } catch (err) {
    console.error("[push] Failed to save token:", err);
  }
}

async function clearPushToken() {
  try { await api.delete("/api/mobile/auth/push-token"); } catch {}
}

export function usePushNotifications() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const lastTokenRef = useRef<string | null>(null);
  const responseListener = useRef<Subscription | null>(null);

  // Register / clear push token when admin auth state changes.
  useEffect(() => {
    if (user?.role === "admin") {
      registerForPushNotifications().then((token) => {
        if (token && token !== lastTokenRef.current) {
          lastTokenRef.current = token;
          savePushToken(token);
        }
      });
    } else if (!user && lastTokenRef.current) {
      clearPushToken();
      lastTokenRef.current = null;
    }
  }, [user?.id, user?.role]);

  // Tapping the OS notification navigates to admin orders.
  useEffect(() => {
    if (!Notifications) return;
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        if (data?.type === "new_order") {
          router.push("/admin/orders");
        } else if (data?.type === "new_ticket" && data.ticketId) {
          router.push(`/support/ticket/${data.ticketId}` as any);
        }
      }
    );
    return () => { responseListener.current?.remove(); };
  }, [router]);
}
