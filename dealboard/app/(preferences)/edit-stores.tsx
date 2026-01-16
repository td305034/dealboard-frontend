import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Text, Button, Snackbar } from "react-native-paper";
import { BASE_SPRING_URL, SPRING_TUNNEL } from "@/utils/constants";
import { router, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { authFetch } from "@/utils/authService";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/auth";
import OnboardingButtons from "@/components/OnboardingButtons";
import Slider from "@react-native-community/slider";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface StoreData {
  name: string;
  dealCount: number;
}

export default function EditStoresScreen() {
  const params = useLocalSearchParams();
  const [selectedStores, setSelectedStores] = useState<Set<string>>(new Set());
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [displayedStores, setDisplayedStores] = useState<StoreData[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [storeSearch, setStoreSearch] = useState("");
  const [storesPage, setStoresPage] = useState(0);
  const [hasChanged, setHasChanged] = useState(false);
  const [radius, setRadius] = useState(5);
  const [radiusInput, setRadiusInput] = useState("5");
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const STORES_PER_PAGE = 30;

  const isWeb = Platform.OS === "web";
  const baseUrl = isWeb ? BASE_SPRING_URL : SPRING_TUNNEL;

  const { completeOnboarding } = useAuth();

  // Load products from params if coming from onboarding
  useEffect(() => {
    if (params.selectedProducts) {
      try {
        const products = JSON.parse(params.selectedProducts as string);
        setSelectedProducts(new Set(products));
      } catch (error) {
        console.error("Error parsing selectedProducts:", error);
      }
    }
  }, [params.selectedProducts]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (storeSearch.trim()) {
      const filtered = stores.filter((s) =>
        s.name.toLowerCase().includes(storeSearch.toLowerCase())
      );
      setDisplayedStores(filtered.slice(0, STORES_PER_PAGE));
    } else {
      setDisplayedStores(stores.slice(0, (storesPage + 1) * STORES_PER_PAGE));
    }
  }, [storeSearch, stores, storesPage]);

  useEffect(() => {
    setRadiusInput(radius.toString());
  }, [radius]);

  const fetchData = async () => {
    try {
      const [storesResponse, selectedResponse] = await Promise.all([
        authFetch(`${baseUrl}/api/stores`, {
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        }),
        authFetch(`${baseUrl}/api/users/selected-stores`, {
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        }),
      ]);

      if (storesResponse.ok) {
        const storesData: StoreData[] = await storesResponse.json();
        setStores(storesData);
      } else {
        const errorText = await storesResponse.text();
        console.error("Stores fetch error:", errorText);
      }

      if (selectedResponse.ok) {
        const selectedStoresData = await selectedResponse.json();
        const storesArray = selectedStoresData.stores || selectedStoresData;
        setSelectedStores(new Set(storesArray));
      } else {
        const errorText = await selectedResponse.text();
        console.error("Selected stores error:", errorText);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadMoreStores = () => {
    setStoresPage((prev) => prev + 1);
  };

  const toggleStore = (store: string) => {
    setHasChanged(true);
    setSelectedStores((prev) => {
      const next = new Set(prev);
      if (next.has(store)) {
        next.delete(store);
      } else {
        next.add(store);
      }
      return next;
    });
  };

  const findNearbyStores = async () => {
    setLoadingNearby(true);
    try {
      setSelectedStores(new Set());
      // Sprawdź czy usługi lokalizacji są włączone
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert(
          "Lokalizacja wyłączona",
          "Włącz usługi lokalizacji w ustawieniach urządzenia, aby znaleźć sklepy w pobliżu."
        );
        setLoadingNearby(false);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Brak uprawnień",
          "Aplikacja potrzebuje dostępu do lokalizacji, aby znaleźć sklepy w pobliżu."
        );
        setLoadingNearby(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        mayShowUserSettingsDialog: true,
      });

      const { latitude, longitude } = location.coords;

      const response = await authFetch(
        `${baseUrl}/api/shops/nearby/unique?lat=${latitude}&lon=${longitude}&radiusKm=${radius}`,
        {
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch nearby stores");
      }

      const nearbyStores: string[] = await response.json();

      const storeNameMap = new Map<string, string>();
      stores.forEach((s) => {
        storeNameMap.set(s.name.toUpperCase(), s.name);
      });

      const storesToSelect: string[] = [];
      nearbyStores.forEach((apiStoreName) => {
        const originalName = storeNameMap.get(apiStoreName.toUpperCase());
        if (originalName) {
          storesToSelect.push(originalName);
        }
      });

      setSelectedStores((prev) => {
        const next = new Set(prev);
        storesToSelect.forEach((store) => next.add(store));
        return next;
      });
      setHasChanged(true);
      if (storesToSelect.length === 0) {
        setSnackbarMessage(
          `Nie znaleziono żadnego sklepu w promieniu ${radius} km`
        );
      } else {
        setSnackbarMessage("Znaleziono sklepy na podstawie lokalizacji");
      }
      setSnackbarVisible(true);
    } catch (error) {
      Alert.alert(
        "Błąd",
        "Nie udało się znaleźć sklepów w pobliżu. Sprawdź połączenie internetowe i spróbuj ponownie."
      );
    } finally {
      setLoadingNearby(false);
    }
  };

  const handleSave = async () => {
    if (selectedStores.size === 0) {
      alert("Wybierz przynajmniej jeden sklep!");
      return;
    }

    setLoading(true);
    try {
      const response = await authFetch(
        `${SPRING_TUNNEL}/api/users/selected-stores`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify(Array.from(selectedStores)),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save stores");
      }

      router.back();
    } catch (error) {
      console.error("Error saving stores:", error);
      alert("Wystąpił błąd podczas zapisywania sklepów");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    if (selectedStores.size === 0) {
      alert("Wybierz przynajmniej jeden sklep!");
      return;
    }

    setLoading(true);
    try {
      const productsResponse = await authFetch(
        `${SPRING_TUNNEL}/api/users/selected-products`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify(Array.from(selectedProducts)),
        }
      );

      if (!productsResponse.ok) {
        const errorText = await productsResponse.text();
        console.error("Błąd przy zapisywaniu produktów:", errorText);
        throw new Error(
          `Nie udało się zapisać produktów: ${productsResponse.status}`
        );
      }

      const storesResponse = await authFetch(
        `${SPRING_TUNNEL}/api/users/selected-stores`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify(Array.from(selectedStores)),
        }
      );
      if (!storesResponse.ok) {
        const errorText = await storesResponse.text();
        console.error("Stores save error:", errorText);
        throw new Error(`Failed to save stores: ${storesResponse.status}`);
      }

      completeOnboarding();

      const hasSeenTutorial = await AsyncStorage.getItem("hasSeenTutorial");
      if (hasSeenTutorial) {
        router.replace("/(protected)/(tabs)");
      } else {
        router.replace("/tutorial");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert(
        `Błąd podczas zapisywania: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7868f5ff" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={styles.title}>
          Moje sklepy
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Wybrane: {selectedStores.size}
        </Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Szukaj sklepu..."
          value={storeSearch}
          onChangeText={setStoreSearch}
        />

        <View style={styles.nearbyContainer}>
          <View style={styles.sliderHeader}>
            <MaterialCommunityIcons
              name="map-marker-radius"
              size={24}
              color="#7868f5ff"
            />
            <Text variant="titleMedium" style={styles.sliderTitle}>
              Znajdź sklepy w pobliżu
            </Text>
          </View>
          <View style={styles.sliderContainer}>
            <View style={styles.radiusInputContainer}>
              <Text style={styles.radiusInputLabel}>Promień:</Text>
              <TextInput
                style={styles.radiusInput}
                value={radiusInput}
                onChangeText={(text) => {
                  setRadiusInput(text);
                  const num = parseFloat(text.replace(",", "."));
                  if (!isNaN(num) && num >= 0.5 && num <= 15) {
                    setRadius(num);
                  }
                }}
                onFocus={() => {
                  // Zaznacz cały tekst gdy użytkownik zaczyna edycję
                }}
                onBlur={() => {
                  const num = parseFloat(radiusInput.replace(",", "."));
                  if (isNaN(num) || num < 0.5) {
                    setRadius(0.5);
                    setRadiusInput("0.5");
                  } else if (num > 15) {
                    setRadius(15);
                    setRadiusInput("15");
                  } else {
                    setRadius(num);
                    setRadiusInput(num.toString());
                  }
                }}
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
              <Text style={styles.radiusInputLabel}>km</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={15}
              step={0.5}
              value={radius}
              onValueChange={setRadius}
              minimumTrackTintColor="#7868f5ff"
              maximumTrackTintColor="#ddd"
              thumbTintColor="#7868f5ff"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>0.5 km</Text>
              <Text style={styles.sliderLabelText}>15 km</Text>
            </View>
          </View>
          <Button
            mode="contained"
            onPress={findNearbyStores}
            loading={loadingNearby}
            disabled={loadingNearby}
            style={styles.nearbyButton}
            buttonColor="#7868f5ff"
            icon="map-search"
          >
            {loadingNearby ? "Szukam..." : "Znajdź sklepy"}
          </Button>
        </View>

        <View style={styles.storesGrid}>
          {displayedStores.map((store) => (
            <TouchableOpacity
              key={store.name}
              style={[
                styles.storeCard,
                selectedStores.has(store.name) && styles.storeCardSelected,
              ]}
              onPress={() => toggleStore(store.name)}
            >
              <View style={styles.storeHeader}>
                <Text
                  style={[
                    styles.storeName,
                    selectedStores.has(store.name) && styles.storeNameSelected,
                  ]}
                >
                  {store.name}
                </Text>
                {selectedStores.has(store.name) && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={24}
                    color="#7868f5ff"
                  />
                )}
              </View>
              <Text
                style={[
                  styles.dealCount,
                  selectedStores.has(store.name) && styles.dealCountSelected,
                ]}
              >
                {store.dealCount} {store.dealCount === 1 ? "oferta" : "ofert"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!storeSearch.trim() && displayedStores.length < stores.length && (
          <Button
            mode="outlined"
            onPress={loadMoreStores}
            style={styles.loadMoreButton}
          >
            Pokaż więcej
          </Button>
        )}

        <OnboardingButtons
          onPrimaryPress={handleSave}
          onSecondaryPress={() => router.back()}
          onAlternativePress={handleFinish}
          hasChanged={hasChanged}
          loading={loading}
        />
      </ScrollView>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    marginBottom: 10,
    fontWeight: "bold",
  },
  subtitle: {
    marginBottom: 20,
    color: "#666",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  storesGrid: {
    gap: 12,
    marginBottom: 20,
  },
  storeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  storeCardSelected: {
    borderColor: "#7868f5ff",
    backgroundColor: "#f3f1ff",
  },
  storeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  storeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  storeNameSelected: {
    color: "#7868f5ff",
  },
  dealCount: {
    fontSize: 14,
    color: "#666",
  },
  dealCountSelected: {
    color: "#7868f5ff",
  },
  loadMoreButton: {
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  button: {
    flex: 1,
  },
  nearbyContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  sliderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sliderTitle: {
    fontWeight: "600",
    color: "#333",
  },
  sliderContainer: {
    marginBottom: 16,
  },
  radiusInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    gap: 8,
  },
  radiusInputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  radiusInput: {
    borderWidth: 1,
    borderColor: "#7868f5ff",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#7868f5ff",
    textAlign: "center",
    minWidth: 60,
  },
  radiusLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7868f5ff",
    marginBottom: 8,
    textAlign: "center",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  sliderLabelText: {
    fontSize: 12,
    color: "#666",
  },
  nearbyButton: {
    borderRadius: 8,
  },
  snackbar: {
    backgroundColor: "#3A3275",
  },
});
