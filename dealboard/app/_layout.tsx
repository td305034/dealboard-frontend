//polyfills for jose library
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";

import { Stack } from "expo-router";
import { AuthProvider } from "@/context/auth";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack>
          <Stack.Screen
            name="index"
            options={{ headerShown: false }}
          ></Stack.Screen>
          <Stack.Screen
            name="(protected)"
            options={{
              headerShown: false,
              animation: "none",
            }}
          />
          <Stack.Screen
            name="sign-in"
            options={{
              animation: "none",
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
