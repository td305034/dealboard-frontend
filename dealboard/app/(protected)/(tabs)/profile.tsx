import { useAuth } from "@/context/auth";
import { View, StyleSheet } from "react-native";
import { Text, Button, Card, Avatar } from "react-native-paper";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Profil
      </Text>

      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          {user?.picture ? (
            <Avatar.Image size={80} source={{ uri: user.picture }} />
          ) : (
            <Avatar.Text size={80} label={user?.name?.charAt(0) || "U"} />
          )}

          <View style={styles.userInfo}>
            <Text variant="titleLarge">{user?.name}</Text>
            <Text variant="bodyMedium" style={styles.email}>
              {user?.email}
            </Text>
            {user?.provider && (
              <Text variant="bodySmall" style={styles.provider}>
                Zalogowano przez: {user.provider}
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={signOut}
        style={styles.button}
        buttonColor="#d32f2f"
      >
        Wyloguj się
      </Button>
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
  card: {
    marginBottom: 20,
  },
  cardContent: {
    alignItems: "center",
  },
  userInfo: {
    alignItems: "center",
    marginTop: 15,
  },
  email: {
    marginTop: 5,
    color: "#666",
  },
  provider: {
    marginTop: 5,
    color: "#999",
  },
  button: {
    marginTop: 10,
  },
});
