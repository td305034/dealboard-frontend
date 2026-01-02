//polyfills for jose library
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";

import { Stack } from "expo-router";
import { AuthProvider } from "@/context/auth";
import { CartProvider } from "@/context/cart";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider as PaperProvider } from "react-native-paper";

import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { NotificationProvider } from "@/context/notification";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND-NOTIFICATION-TASK";

TaskManager.defineTask<Notifications.NotificationTaskPayload>(
  BACKGROUND_NOTIFICATION_TASK,
  async ({ data, error, executionInfo }) => {
    console.log("✅ Received a notification in the background!", {
      data,
      error,
      executionInfo,
    }); // Do something with the notification data
    //
  }
);
Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);

export default function RootLayout() {
  return (
    <PaperProvider>
      <NotificationProvider>
        <AuthProvider>
          <CartProvider>
            <SafeAreaProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <StatusBar style="auto" />
                <Stack
                  screenOptions={{
                    headerShown: false,
                  }}
                />
              </GestureHandlerRootView>
            </SafeAreaProvider>
          </CartProvider>
        </AuthProvider>
      </NotificationProvider>
    </PaperProvider>
  );
}
