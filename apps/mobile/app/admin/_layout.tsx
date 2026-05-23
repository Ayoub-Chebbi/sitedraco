import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0d0d14" } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="orders" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="products" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}
