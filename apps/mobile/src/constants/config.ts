import Constants from "expo-constants";

// Always use the apiUrl from app.json — update it when deploying to production.
export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ?? "http://localhost:3000";

export const APP_NAME = "LootStore";
