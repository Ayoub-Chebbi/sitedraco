import React from "react";
import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCartStore } from "@/store/cart";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const TAB_HEIGHT = 68;

function TabIcon({
  name,
  label,
  focused,
}: {
  name: IoniconName;
  label: string;
  focused: boolean;
}) {
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconPill, focused && styles.iconPillActive]}>
        <Ionicons name={name} size={20} color={focused ? "#a78bfa" : "#4b5563"} />
      </View>
      <Text
        style={[styles.label, focused && styles.labelActive]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {label}
      </Text>
    </View>
  );
}

function CartIcon({ focused }: { focused: boolean }) {
  const count = useCartStore((s) => s.count());
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconPill, focused && styles.iconPillActive]}>
        <Ionicons
          name={focused ? "cart" : "cart-outline"}
          size={20}
          color={focused ? "#a78bfa" : "#4b5563"}
        />
        {count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
          </View>
        )}
      </View>
      <Text
        style={[styles.label, focused && styles.labelActive]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        Panier
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          bottom: insets.bottom,
          left: 0,
          right: 0,
          height: TAB_HEIGHT,
          backgroundColor: "#0d0d14",
          borderTopWidth: 1,
          borderTopColor: "#1f1f35",
          elevation: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.5,
          shadowRadius: 12,
          paddingTop: 0,
          paddingBottom: 0,
        },
        sceneContainerStyle: {
          backgroundColor: "#0d0d14",
        },
        tabBarItemStyle: {
          height: TAB_HEIGHT,
          paddingTop: 0,
          paddingBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? "home" : "home-outline"}
              label="Accueil"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? "game-controller" : "game-controller-outline"}
              label="Boutique"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          tabBarIcon: ({ focused }) => <CartIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? "person" : "person-outline"}
              label="Profil"
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    width: "100%",
    paddingTop: 10,
  },
  iconPill: {
    width: 48,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPillActive: {
    backgroundColor: "rgba(167,139,250,0.12)",
  },
  label: {
    fontSize: 7,
    lineHeight: 9,
    color: "#4b5563",
    fontWeight: "500",
    textAlign: "center",
    maxWidth: 50,
  },
  labelActive: {
    color: "#a78bfa",
    fontWeight: "700",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 2,
    backgroundColor: "#db2777",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#0d0d14",
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
});
