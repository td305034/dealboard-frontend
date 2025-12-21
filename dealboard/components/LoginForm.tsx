import { useState } from "react";
import { useAuth } from "@/context/auth";
import { View, StyleSheet } from "react-native";
import {
  Text,
  Button,
  TextInput,
  Divider,
  HelperText,
} from "react-native-paper";
import { router } from "expo-router";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, signInWithEmail, isLoading } = useAuth();

  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [generalError, setGeneralError] = useState<string>("");

  const handleEmailLogin = async () => {
    // Reset errors
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    if (!email || !password) {
      setGeneralError("Proszę wypełnić wszystkie pola");
      return;
    }

    const result = await signInWithEmail(email, password);

    // Handle field-specific errors
    if (result?.errors) {
      if (result.errors.email) {
        setEmailError(result.errors.email);
      }
      if (result.errors.password) {
        setPasswordError(result.errors.password);
      }
      if (result.errors.general) {
        setGeneralError(result.errors.general);
      }

      console.log("Login errors:", result.errors);
    }
  };

  function handleGoToSignUp() {
    router.replace("/sign-up");
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Logowanie
      </Text>

      <View>
        <TextInput
          label="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailError("");
          }}
          style={styles.input}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          error={!!emailError}
        />
        <HelperText type="error" visible={!!emailError}>
          {emailError || " "}
        </HelperText>
      </View>

      <View>
        <TextInput
          label="Hasło"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setPasswordError("");
          }}
          style={styles.input}
          mode="outlined"
          secureTextEntry
          autoCapitalize="none"
          error={!!passwordError}
        />
        <HelperText type="error" visible={!!passwordError}>
          {passwordError || " "}
        </HelperText>
      </View>

      {generalError && <Text style={styles.error}>{generalError}</Text>}

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
