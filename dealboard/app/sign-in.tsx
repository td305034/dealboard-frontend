import LoadingScreen from "@/components/LoadingScreen";
import LoginForm from "@/components/LoginForm";
import { useAuth } from "@/context/auth";
import { Redirect } from "expo-router";

export default function SignInScreen() {
  const { user, isLoading, onboardingCompleted } = useAuth();

  if (isLoading || (user && onboardingCompleted === null)) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginForm />;
  }

  console.log("onboardingCompleted:", onboardingCompleted);
  if (!onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(protected)/(tabs)" />;
}
