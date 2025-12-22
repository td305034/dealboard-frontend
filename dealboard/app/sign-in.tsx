import LoadingScreen from "@/components/LoadingScreen";
import LoginForm from "@/components/LoginForm";
import { useAuth } from "@/context/auth";
import { Redirect } from "expo-router";

export default function SignInScreen() {
  const { user, isLoading } = useAuth();

  // Show loading only when checking session, not during login
  if (!user && isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginForm />;
  }

  if (user.onboardingCompleted === false) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(protected)/(tabs)" />;
}
