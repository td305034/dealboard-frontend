import { useState } from "react";
import { useAuth } from "@/context/auth";
import { View, StyleSheet } from "react-native";
import { Text, Button, TextInput } from "react-native-paper";
import { Link, router } from "expo-router";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signUp, isLoading, error } = useAuth();
  const [registrationError, setRegistrationError] = useState<string | null>("");

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setRegistrationError("Please fill all required fields");
      return;
    }
    setRegistrationError(null);

    await signUp(name, email, password);
  };

  function handleGoToSignIn() {
    router.push("/");
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Rejestracja
      </Text>

      <TextInput
        label="Imię"
        value={name}
        onChangeText={setName}
        style={styles.input}
        mode="outlined"
        autoCapitalize="words"
      />

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

      {registrationError && (
        <Text style={styles.error}>
          {registrationError || "Błąd rejestracji"}
        </Text>
      )}

      <Button
        mode="contained"
        onPress={handleRegister}
        loading={isLoading}
        disabled={isLoading || !name || !email || !password}
        style={styles.button}
      >
        Zarejestruj się
      </Button>

      <View style={styles.linkContainer}>
        <Text>Masz już konto? </Text>
        <Button mode="text" onPress={handleGoToSignIn}>
          Zaloguj się
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
    marginBottom: 20,
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
  },
});
