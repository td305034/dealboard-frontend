import LoadingScreen from "@/components/LoadingScreen";
import LoginForm from "@/components/LoginForm";
import { useAuth } from "@/context/auth";
import { Redirect } from "expo-router";

export default function SignInScreen() {
  const { user, isLoading, onboardingCompleted } = useAuth();

  // Show loading only when checking session, not during login
  if (!user && onboardingCompleted === null && isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginForm />;
  }

  console.log("onboardingCompleted:", onboardingCompleted);
  if (onboardingCompleted === false) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(protected)/(tabs)" />;
}
