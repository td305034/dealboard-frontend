import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Text, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

const slides = [
  {
    icon: "hand-wave" as const,
    title: "Witaj w Dealboard",
    description: "Ta aplikacja posłuży ci do wygodnego porównywania promocji.",
    buttonText: "Zaczynamy!",
  },
  {
    icon: "cart-outline" as const,
    title: "Wybierz produkty",
    description:
      "Po zalogowaniu na pierwszym ekranie możesz wybrać produkty, które Cię interesują.",
    buttonText: "Dalej",
  },
  {
    icon: "store" as const,
    title: "Wybierz sklepy",
    description:
      "Na kolejnym zostaniesz poproszony o wybranie sklepów, w których chcesz śledzić promocje",
    buttonText: "Do dzieła!",
  },
];

export default function WelcomeScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: width * (currentIndex + 1),
        animated: true,
      });
    } else {
      await AsyncStorage.setItem("hasSeenWelcome", "true");
      router.replace("/sign-in");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name={slide.icon}
                size={120}
                color="#7868f5ff"
              />
            </View>
            <Text variant="headlineLarge" style={styles.title}>
              {slide.title}
            </Text>
            <Text variant="bodyLarge" style={styles.description}>
              {slide.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === currentIndex && styles.dotActive]}
            />
          ))}
        </View>
        <Button
          mode="contained"
          onPress={handleNext}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {slides[currentIndex].buttonText}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  slide: {
    width,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 40,
  },
  title: {
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#1a1a1a",
  },
  description: {
    textAlign: "center",
    color: "#666",
    lineHeight: 24,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ddd",
  },
  dotActive: {
    backgroundColor: "#7868f5ff",
    width: 24,
  },
  button: {
    backgroundColor: "#7868f5ff",
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
