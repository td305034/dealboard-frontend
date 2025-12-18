import { useState } from "react";
import { useAuth } from "@/context/auth";
import { View, StyleSheet } from "react-native";
import { Text, Button, TextInput, Divider } from "react-native-paper";
import { router } from "expo-router";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, signInWithEmail, isLoading } = useAuth();

  const [error, setError] = useState<string | null>("");

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError("Please fill all required fields");
      return;
    }
    setError(null);

    await signInWithEmail(email, password);
  };

  function handleGoToSignUp() {
    router.replace("/sign-up");
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Logowanie
      </Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        label="Hasło"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        mode="outlined"
        secureTextEntry
        autoCapitalize="none"
      />

      {error && <Text style={styles.error}>{error || "Błąd logowania"}</Text>}

      <Button
        mode="contained"
        onPress={handleEmailLogin}
        loading={isLoading}
        disabled={isLoading || !email || !password}
        style={styles.button}
      >
        Zaloguj się
      </Button>

      <Divider style={styles.divider} />

      <Button
        mode="outlined"
        onPress={signIn}
        disabled={isLoading}
        style={styles.button}
      >
        Zaloguj przez Google
      </Button>

      <View style={styles.linkContainer}>
        <Text>Nie masz konta? </Text>
        <Button mode="text" onPress={handleGoToSignUp}>
          Zarejestruj się
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
  divider: {
    marginVertical: 20,
  },
  error: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
});
