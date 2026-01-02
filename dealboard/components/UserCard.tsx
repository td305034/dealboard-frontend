import { useAuth } from "@/context/auth";
import { View, StyleSheet } from "react-native";
import { Avatar, Card, Text } from "react-native-paper";

export default function UserCard() {
  const { user } = useAuth();
  return (
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
  );
}

const styles = StyleSheet.create({
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
});
