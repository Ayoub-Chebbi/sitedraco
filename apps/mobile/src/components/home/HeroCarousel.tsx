import React, { useRef, useState, useEffect } from "react";
import { View, Text, Pressable, Dimensions, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    badge: "🎮  Jeux PC & Console",
    title: "Les meilleurs jeux\nau meilleur prix",
    subtitle: "PlayStation, Xbox, Steam et plus",
    colors: ["#1a0040", "#0d0d14"] as [string, string],
    accent: "#a78bfa",
    href: "/(tabs)/products",
  },
  {
    id: "2",
    badge: "🔥  Offres limitées",
    title: "Jusqu'à -50%\nsur les top jeux",
    subtitle: "Promos exclusives chaque semaine",
    colors: ["#3b0764", "#1f0030"] as [string, string],
    accent: "#f0abfc",
    href: "/(tabs)/products",
  },
  {
    id: "3",
    badge: "🎁  Gift Cards",
    title: "Cartes cadeaux\npour tous",
    subtitle: "PlayStation Network, Xbox, Steam…",
    colors: ["#0c1445", "#0d0d14"] as [string, string],
    accent: "#60a5fa",
    href: "/(tabs)/products",
  },
];

export function HeroCarousel() {
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatRef = useRef<any>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startTimer(idx: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const next = (idx + 1) % SLIDES.length;
      flatRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIndex(next);
      startTimer(next);
    }, 4500);
  }

  useEffect(() => {
    startTimer(0);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(idx);
          startTimer(idx);
        }}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <LinearGradient
            colors={item.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.slide}
          >
            {/* Decorative circles */}
            <View style={[styles.circle, styles.circleL, { backgroundColor: item.accent + "15" }]} />
            <View style={[styles.circle, styles.circleS, { backgroundColor: item.accent + "10" }]} />

            <View style={styles.slideContent}>
              {/* Badge */}
              <View style={[styles.badge, { backgroundColor: item.accent + "20", borderColor: item.accent + "40" }]}>
                <Text style={[styles.badgeText, { color: item.accent }]}>{item.badge}</Text>
              </View>

              {/* Title */}
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>

              {/* CTA */}
              <Pressable
                onPress={() => router.push(item.href as any)}
                style={({ pressed }) => [styles.cta, { backgroundColor: item.accent, opacity: pressed ? 0.85 : 1 }]}
              >
                <Text style={styles.ctaText}>Découvrir</Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </Pressable>
            </View>
          </LinearGradient>
        )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const dotWidth = scrollX.interpolate({ inputRange, outputRange: [6, 20, 6], extrapolate: "clamp" });
          const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: "clamp" });
          return (
            <Animated.View
              key={i}
              style={[styles.dot, { width: dotWidth, opacity, backgroundColor: SLIDES[activeIndex].accent }]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 230, position: "relative" },
  slide: {
    width,
    height: 230,
    paddingHorizontal: 24,
    justifyContent: "center",
    overflow: "hidden",
  },
  circle: {
    position: "absolute",
    borderRadius: 999,
  },
  circleL: { width: 220, height: 220, right: -60, top: -60 },
  circleS: { width: 120, height: 120, right: 40, bottom: -30 },
  slideContent: { gap: 10, zIndex: 1 },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: { fontSize: 12, fontWeight: "700" },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  subtitle: { color: "rgba(255,255,255,0.6)", fontSize: 13 },
  cta: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginTop: 4,
  },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  dots: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
