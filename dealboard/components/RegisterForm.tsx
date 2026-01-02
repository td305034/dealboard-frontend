import { useState } from "react";
import { useAuth } from "@/context/auth";
import { View, StyleSheet } from "react-native";
import { Text, Button, TextInput, HelperText } from "react-native-paper";
import { Link, router } from "expo-router";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatedPassword, setRepeatedPassword] = useState("");
  const { signUp, isLoading } = useAuth();

  const [nameError, setNameError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [repeatedPasswordError, setRepeatedPasswordError] =
    useState<string>("");
  const [generalError, setGeneralError] = useState<string>("");

  const handleRegister = async () => {
    // Reset errors
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setGeneralError("");
    setRepeatedPasswordError("");

    if (!name || !email || !password) {
      setGeneralError("Proszę wypełnić wszystkie pola");
      return;
    }

    if (password !== repeatedPassword)
      setRepeatedPasswordError("Powtórzone hasło jest inne niż hasło!");
    const result = await signUp(name, email, password);

    // Handle field-specific errors
    if (result?.errors) {
      if (result.errors.name) {
        setNameError(result.errors.name);
      }
      if (result.errors.email) {
        setEmailError(result.errors.email);
      }
      if (result.errors.password) {
        setPasswordError(result.errors.password);
      }
      if (result.errors.general) {
        setGeneralError(result.errors.general);
      }
    } else {
      router.replace("/");
    }
  };

  function handleGoToSignIn() {
    router.push("/");
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Rejestracja
      </Text>

      <View>
        <TextInput
          label="Imię"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setNameError("");
          }}
          style={styles.input}
          mode="outlined"
          autoCapitalize="words"
          error={!!nameError}
        />
        {nameError && (
          <HelperText type="error" visible={!!nameError}>
            {nameError}
          </HelperText>
        )}
      </View>

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
        {emailError && (
          <HelperText type="error" visible={!!emailError}>
            {emailError}
          </HelperText>
        )}
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
        {passwordError && (
          <HelperText type="error" visible={!!passwordError}>
            {passwordError}
          </HelperText>
        )}
      </View>
      <View>
        <TextInput
          label="Powtórz hasło"
          value={repeatedPassword}
          onChangeText={(text) => {
            setRepeatedPassword(text);
            setRepeatedPasswordError("");
          }}
          style={styles.input}
          mode="outlined"
          secureTextEntry
          autoCapitalize="none"
          error={!!repeatedPasswordError}
        />
        {repeatedPasswordError && (
          <HelperText type="error" visible={!!repeatedPasswordError}>
            {repeatedPasswordError}
          </HelperText>
        )}
      </View>

      {generalError && <Text style={styles.error}>{generalError}</Text>}

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
