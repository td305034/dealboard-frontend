import { View, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export const renderRightActions = () => {
  return (
    <View style={styles.swipeActionLeft}>
      <MaterialCommunityIcons
        name="shopping-outline"
        size={32}
        color={"#fff"}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  swipeActionLeft: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-end",
    borderRadius: 18,
    marginBottom: 12,
    marginTop: 2,
    paddingRight: 16,
    backgroundColor: "#4caf50",
  },
});
