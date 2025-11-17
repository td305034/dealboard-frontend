import { View, StyleSheet } from "react-native";
import { Text, Card } from "react-native-paper";

export default function DealsScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Twoje Deale
      </Text>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">Lista dealów</Text>
          <Text variant="bodyMedium" style={styles.text}>
            Tutaj będą wyświetlane Twoje deale
          </Text>
        </Card.Content>
      </Card>
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
    marginBottom: 15,
  },
  text: {
    marginTop: 10,
  },
});
