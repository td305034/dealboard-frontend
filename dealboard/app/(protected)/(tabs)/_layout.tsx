import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import CartButton from "@/components/CartButton";
import CartModal from "@/components/CartModal";

export default function TabsLayout() {
  const [cartModalVisible, setCartModalVisible] = React.useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerRight: () => (
            <CartButton onPress={() => setCartModalVisible(true)} />
          ),
          tabBarInactiveTintColor: "#666",
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Twoje aktualne promocje",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="label-percent-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="allDeals"
          options={{
            title: "Wszystkie oferty",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="view-list-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profil",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="account-circle-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
      <CartModal
        visible={cartModalVisible}
        onClose={() => setCartModalVisible(false)}
      />
    </>
  );
}
