import UserCard from "@/components/UserCard";
import { useAuth } from "@/context/auth";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import {
  Text,
  Button,
  Portal,
  Dialog,
  TextInput,
  Snackbar,
} from "react-native-paper";
import { useState } from "react";
import { router } from "expo-router";

export default function ProfileScreen() {
  const { user, signOut, changePassword, changeName } = useAuth();
  const { width } = useWindowDimensions();
  const [portalVisible, setPortalVisible] = useState(false);
  const [nameDialogVisible, setNameDialogVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState(
    "Hasło zostało pomyślnie zmienione."
  );
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [nameLoading, setNameLoading] = useState(false);

  const onShowSnackBar = () => setSnackbarVisible(true);
  const onDismissSnackBar = () => setSnackbarVisible(false);

  const showDialog = () => setPortalVisible(true);
  const hideDialog = () => {
    setPortalVisible(false);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  };

  const handleChangePassword = async () => {
    setLoading(true);
    setError("");
    setFieldErrors({});

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("Wszystkie pola są wymagane");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Nowe hasła nie są identyczne");
      setLoading(false);
      return;
    }

    const result = await changePassword(oldPassword, newPassword);

    if (result?.success) {
      hideDialog();
      setSnackbarMessage("Hasło zostało pomyślnie zmienione.");
      onShowSnackBar();
    } else if (result?.fieldErrors) {
      setFieldErrors(result.fieldErrors);
    } else if (result?.error) {
      setError(result.error);
    }

    setLoading(false);
  };

  const showNameDialog = () => {
    setNewName(user?.name || "");
    setNameDialogVisible(true);
  };

  const hideNameDialog = () => {
    setNameDialogVisible(false);
    setNewName("");
    setNameError("");
  };

  const handleChangeName = async () => {
    setNameLoading(true);
    setNameError("");

    if (!newName || newName.trim() === "") {
      setNameError("Imię nie może być puste");
      setNameLoading(false);
      return;
    }

    const result = await changeName(newName);

    if (result?.success) {
      hideNameDialog();
      setSnackbarMessage("Imię zostało pomyślnie zmienione.");
      onShowSnackBar();
    } else if (result?.error) {
      setNameError(result.error);
    }

    setNameLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Profil
      </Text>

      <UserCard />

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Ustawienia konta
      </Text>

      <Button
        mode="contained"
        onPress={showNameDialog}
        style={styles.button}
        buttonColor="#7868f5ff"
      >
        Zmień imię
      </Button>

      {user?.provider === "LOCAL" && (
        <Button
          mode="contained"
          onPress={showDialog}
          style={styles.button}
          buttonColor="#7868f5ff"
        >
          Zmień hasło
        </Button>
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Preferencje
      </Text>

      <Button
        mode="contained"
        onPress={() => router.push("/edit-products")}
        style={styles.button}
        buttonColor="#7868f5ff"
      >
        Moje produkty
      </Button>

      <Button
        mode="contained"
        onPress={() => router.push("/edit-stores")}
        style={styles.button}
        buttonColor="#7868f5ff"
      >
        Moje sklepy
      </Button>

      <Button
        mode="contained"
        onPress={signOut}
        style={styles.button}
        buttonColor="#d32f2f"
      >
        Wyloguj się
      </Button>

      <Portal>
        <Dialog visible={nameDialogVisible} onDismiss={hideNameDialog}>
          <Dialog.Title>Zmiana imienia</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nowe imię"
              value={newName}
              onChangeText={setNewName}
              mode="outlined"
              style={styles.input}
            />
            {nameError ? <Text style={styles.error}>{nameError}</Text> : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideNameDialog} disabled={nameLoading}>
              Anuluj
            </Button>
            <Button
              onPress={handleChangeName}
              loading={nameLoading}
              disabled={nameLoading}
            >
              Zatwierdź
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={portalVisible} onDismiss={hideDialog}>
          <Dialog.Title>Zmiana hasła</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Stare hasło"
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry
              mode="outlined"
              style={styles.input}
            />
            {fieldErrors?.oldPassword && (
              <Text style={styles.error}>{fieldErrors.oldPassword}</Text>
            )}
            <TextInput
              label="Nowe hasło"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Potwierdź nowe hasło"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              mode="outlined"
              style={styles.input}
            />
            {fieldErrors?.newPassword && (
              <Text style={styles.error}>{fieldErrors.newPassword}</Text>
            )}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog} disabled={loading}>
              Anuluj
            </Button>
            <Button
              onPress={handleChangePassword}
              loading={loading}
              disabled={loading}
            >
              Zatwierdź
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={onDismissSnackBar}
        style={[styles.snackbar, { width: width - 20 }]}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    fontWeight: "600",
  },
  button: {
    marginTop: 10,
  },
  input: {
    marginBottom: 12,
  },
  error: {
    color: "#d32f2f",
    marginTop: 8,
    fontSize: 12,
  },
  snackbar: {
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 0,
    backgroundColor: "#3A3275",
  },
});
