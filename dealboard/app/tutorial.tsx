import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TutorialScreen() {
  const handleStart = async () => {
    await AsyncStorage.setItem("hasSeenTutorial", "true");
    router.replace("/(protected)/(tabs)");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="view-dashboard"
            size={120}
            color="#7868f5ff"
          />
        </View>
        <Text variant="headlineLarge" style={styles.title}>
          Główny ekran
        </Text>
        <Text variant="bodyLarge" style={styles.description}>
          Tutaj znajdziesz wszystkie aktualne promocje dopasowane do Twoich
          preferencji.
        </Text>
        <View style={styles.tipsContainer}>
          <View style={styles.tip}>
            <MaterialCommunityIcons
              name="gesture-swipe-left"
              size={32}
              color="#7868f5ff"
            />
            <Text style={styles.tipText}>
              Przesuń w lewo, aby dodać do koszyka
            </Text>
          </View>
          <View style={styles.tip}>
            <MaterialCommunityIcons name="bell" size={32} color="#7868f5ff" />
            <Text style={styles.tipText}>
              Kliknij dzwonek, aby włączyć powiadomienia o zmianach ceny
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleStart}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Na zakupy!
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
  content: {
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
    marginBottom: 40,
  },
  tipsContainer: {
    width: "100%",
    gap: 20,
  },
  tip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  button: {
    backgroundColor: "#7868f5ff",
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
