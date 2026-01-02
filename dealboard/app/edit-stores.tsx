import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Text, Button } from "react-native-paper";
import { SPRING_TUNNEL } from "@/utils/constants";
import { router, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { authFetch } from "@/utils/authService";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/auth";
import OnboardingButtons from "@/components/OnboardingButtons";

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
  const STORES_PER_PAGE = 30;

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

  const fetchData = async () => {
    try {
      const [storesResponse, selectedResponse] = await Promise.all([
        authFetch(`${SPRING_TUNNEL}/api/stores`, {
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        }),
        authFetch(`${SPRING_TUNNEL}/api/users/selected-stores`, {
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

      router.replace("/(protected)/(tabs)");
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
});
