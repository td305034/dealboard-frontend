import { Redirect, Stack } from "expo-router";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@/context/auth";

export default function RootLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <React.Fragment>
      <StatusBar style="auto" />
      <Stack />
    </React.Fragment>
  );
}
