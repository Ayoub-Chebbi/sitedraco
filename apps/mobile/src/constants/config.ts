import Constants from "expo-constants";

const PROD_URL = "https://loot.tn";

// Use apiUrl from app.json/eas.json if set, otherwise fall back to production.
// Never falls back to localhost — that caused all products to show as out of stock.
export const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? PROD_URL;

export const APP_NAME = "LootStore";
