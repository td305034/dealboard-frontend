import { useAuth } from "@/context/auth";
import { View } from "react-native";
import { Button } from "react-native-paper";
import { StyleSheet } from "react-native";

interface OnboardingButtonsProps {
  onPrimaryPress: () => void;
  onSecondaryPress?: () => void;
  onAlternativePress?: () => void;
  hasChanged?: boolean;
  loading: boolean;
}

const OnboardingButtons = ({
  onPrimaryPress,
  onSecondaryPress,
  onAlternativePress,
  hasChanged,
  loading,
}: OnboardingButtonsProps) => {
  const { user } = useAuth();

  return (
    <View style={styles.buttonContainer}>
      {user?.onboardingCompleted ? (
        <>
          <Button
            mode="outlined"
            onPress={onSecondaryPress}
            style={styles.button}
            disabled={loading}
          >
            Anuluj
          </Button>

          <Button
            mode="contained"
            onPress={onPrimaryPress}
            style={styles.button}
            buttonColor="#7868f5ff"
            loading={loading}
            disabled={loading || !hasChanged}
          >
            Zapisz
          </Button>
        </>
      ) : (
        <Button
          mode="contained"
          onPress={onAlternativePress}
          style={styles.button}
          buttonColor="#7868f5ff"
          loading={loading}
          disabled={loading}
        >
          Dalej
        </Button>
      )}
    </View>
  );
};

export default OnboardingButtons;

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  button: {
    flex: 1,
  },
});
