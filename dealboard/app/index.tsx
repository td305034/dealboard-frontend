import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, View, StyleSheet } from "react-native";

export default function HomeScreen() {
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);

  useEffect(() => {
    checkWelcomeStatus();
  }, []);

  const checkWelcomeStatus = async () => {
    const seen = await AsyncStorage.getItem("hasSeenWelcome");
    setHasSeenWelcome(seen === "true");
  };

  if (hasSeenWelcome === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7868f5ff" />
      </View>
    );
  }

  return <Redirect href={hasSeenWelcome ? "/sign-in" : "/welcome"} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
});
