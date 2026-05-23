import { Platform } from "react-native";
import Constants from "expo-constants";

// expo-notifications crashes at import time in Expo Go (SDK 53+).
// Lazy require ensures the guard runs before the module loads.
type NotificationsModule = typeof import("expo-notifications");

const IS_EXPO_GO = Constants.appOwnership === "expo";

export const Notifications: NotificationsModule | null = IS_EXPO_GO
  ? null
  : (() => {
      try {
        return require("expo-notifications") as NotificationsModule;
      } catch {
        return null;
      }
    })();

if (Notifications) {
  // shouldShowAlert: false → our custom banner handles the visual
  // shouldPlaySound: true  → OS plays ching.wav from the notification channel
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: false,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Create the Android channel at module init so it exists before
  // scheduleChingSound() is ever called (not just after permission grant).
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("new-orders", {
      name: "Nouvelles commandes",
      importance: Notifications.AndroidImportance.MAX,
      sound: "ching.wav",
      vibrationPattern: [0, 250, 100, 250],
      lightColor: "#a78bfa",
    }).catch(() => {});
  }
}

// Schedule an immediate silent local notification whose only purpose is to
// trigger the ching.wav sound via the "new-orders" Android channel.
// channelId is required on Android API 26+ — without it the notification is
// silently dropped.
export async function scheduleChingSound() {
  if (!Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "",
        body: "",
        sound: "ching.wav",
        channelId: "new-orders",
        data: { type: "ching_sound" },
      },
      trigger: null,
    });
  } catch {}
}
