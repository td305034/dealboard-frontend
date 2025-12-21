import { ActivityIndicator } from "react-native";
import { useAuth } from "@/context/auth";
import LoginForm from "@/components/LoginForm";
import LoadingScreen from "@/components/LoadingScreen";
import { Redirect } from "expo-router";

export default function HomeScreen() {
  return <Redirect href="/sign-in" />;
}
