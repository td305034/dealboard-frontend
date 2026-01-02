import LoadingScreen from "@/components/LoadingScreen";
import LoginForm from "@/components/LoginForm";
import { useAuth } from "@/context/auth";
import { tokenCache } from "@/utils/cache";
import { REFRESH_TOKEN_KEY_NAME, TOKEN_KEY_NAME } from "@/utils/constants";
import { Redirect } from "expo-router";

export default function SignInScreen() {
  const { user, isLoading } = useAuth();
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
