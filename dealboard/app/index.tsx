import { ActivityIndicator } from "react-native";
import { useAuth } from "@/context/auth";
import LoginForm from "@/components/LoginForm";
export default function HomeScreen() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <></>;
  }

  if (!user) {
    return <LoginForm />;
  }

  return <></>;
}
