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
import { SPRING_TUNNEL, TOKEN_KEY_NAME } from "@/utils/constants";
import { tokenCache } from "@/utils/cache";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { authFetch } from "@/utils/authService";

const POPULAR_PRODUCTS = [
  // Dairy
  "mleko",
  "ser",
  "masło",
  "jogurt",
  "śmietana",
  "twaróg",
  // Bread & Bakery
  "chleb",
  "bułka",
  "rogal",
  "croissant",
  // Meat
  "kurczak",
  "wieprzowina",
  "wołowina",
  "kiełbasa",
  "szynka",
  // Beverages
  "kawa",
  "herbata",
  "sok",
  "woda",
  "cola",
  "piwo",
  // Fruits & Vegetables
  "jabłko",
  "banan",
  "pomarańcza",
  "ziemniaki",
  "pomidor",
  "ogórek",
  // Other
  "jajka",
  "mąka",
  "cukier",
  "ryż",
  "makaron",
  "olej",
];

interface StoreData {
  name: string;
  dealCount: number;
}

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  );
  const [selectedStores, setSelectedStores] = useState<Set<string>>(new Set());
  const [customProduct, setCustomProduct] = useState("");
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [displayedStores, setDisplayedStores] = useState<StoreData[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [storeSearch, setStoreSearch] = useState("");
  const [storesPage, setStoresPage] = useState(0);
  const STORES_PER_PAGE = 30;

  useEffect(() => {
    if (step === 2) {
      fetchStores();
    }
  }, [step]);

  useEffect(() => {
    if (storeSearch.trim()) {
      // Filter stores by search
      const filtered = stores.filter((s) =>
        s.name.toLowerCase().includes(storeSearch.toLowerCase())
      );
      setDisplayedStores(filtered.slice(0, STORES_PER_PAGE));
    } else {
      // Show paginated popular stores
      setDisplayedStores(stores.slice(0, (storesPage + 1) * STORES_PER_PAGE));
    }
  }, [storeSearch, stores, storesPage]);

  const fetchStores = async () => {
    setLoadingStores(true);
    try {
      const token = await tokenCache?.getToken(TOKEN_KEY_NAME);
      const response = await authFetch(`${SPRING_TUNNEL}/api/stores`, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: StoreData[] = await response.json();
        setStores(data);
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
    } finally {
      setLoadingStores(false);
    }
  };

  const loadMoreStores = () => {
    setStoresPage((prev) => prev + 1);
  };

  const toggleProduct = (product: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(product)) {
        next.delete(product);
      } else {
        next.add(product);
      }
      return next;
    });
  };

  const toggleStore = (store: string) => {
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

  const addCustomProduct = () => {
    if (customProduct.trim()) {
      toggleProduct(customProduct.trim().toLowerCase());
      setCustomProduct("");
    }
  };

  const handleFinish = async () => {
    if (selectedProducts.size === 0 || selectedStores.size === 0) {
      alert("Wybierz przynajmniej jeden produkt i jeden sklep!");
      return;
    }

    setLoading(true);
    try {
      const token = await tokenCache?.getToken(TOKEN_KEY_NAME);

      console.log("Saving preferences...");
      console.log("Selected products:", Array.from(selectedProducts));
      console.log("Selected stores:", Array.from(selectedStores));

      // Save tracked products
      const productsResponse = await fetch(
        `${SPRING_TUNNEL}/api/users/tracked-products`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(Array.from(selectedProducts)),
        }
      );

      console.log("Products save response:", productsResponse.status);
      if (!productsResponse.ok) {
        const errorText = await productsResponse.text();
        console.error("Products save error:", errorText);
        throw new Error(`Failed to save products: ${productsResponse.status}`);
      }

      // Save selected stores
      const storesResponse = await fetch(
        `${SPRING_TUNNEL}/api/users/selected-stores`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(Array.from(selectedStores)),
        }
      );

      console.log("Stores save response:", storesResponse.status);
      if (!storesResponse.ok) {
        const errorText = await storesResponse.text();
        console.error("Stores save error:", errorText);
        throw new Error(`Failed to save stores: ${storesResponse.status}`);
      }

      console.log("Preferences saved successfully!");
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {step === 1 ? "Wybierz produkty" : "Wybierz sklepy"}
        </Text>
        <Text style={styles.subtitle}>
          {step === 1
            ? "Jakie produkty Cię interesują?"
            : "W jakich sklepach robisz zakupy?"}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 ? (
          <>
            <View style={styles.customInput}>
              <TextInput
                style={styles.input}
                placeholder="Dodaj własny produkt..."
                value={customProduct}
                onChangeText={setCustomProduct}
                onSubmitEditing={addCustomProduct}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={addCustomProduct}
              >
                <MaterialCommunityIcons name="plus" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.chipContainer}>
              {POPULAR_PRODUCTS.map((product) => (
                <TouchableOpacity
                  key={product}
                  style={[
                    styles.chip,
                    selectedProducts.has(product) && styles.chipSelected,
                  ]}
                  onPress={() => toggleProduct(product)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedProducts.has(product) && styles.chipTextSelected,
                    ]}
                  >
                    {product}
                  </Text>
                </TouchableOpacity>
              ))}
              {Array.from(selectedProducts)
                .filter((p) => !POPULAR_PRODUCTS.includes(p))
                .map((product) => (
                  <TouchableOpacity
                    key={product}
                    style={[styles.chip, styles.chipSelected]}
                    onPress={() => toggleProduct(product)}
                  >
                    <Text style={styles.chipTextSelected}>{product}</Text>
                  </TouchableOpacity>
                ))}
            </View>
          </>
        ) : (
          <>
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color="#666"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Szukaj sklepu..."
                value={storeSearch}
                onChangeText={setStoreSearch}
              />
            </View>

            {loadingStores ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2e7d32" />
                <Text style={styles.loadingText}>Ładowanie sklepów...</Text>
              </View>
            ) : (
              <>
                <View style={styles.chipContainer}>
                  {displayedStores.map((storeData) => (
                    <TouchableOpacity
                      key={storeData.name}
                      style={[
                        styles.chip,
                        selectedStores.has(storeData.name) &&
                          styles.chipSelected,
                      ]}
                      onPress={() => toggleStore(storeData.name)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selectedStores.has(storeData.name) &&
                            styles.chipTextSelected,
                        ]}
                      >
                        {storeData.name}
                      </Text>
                      <Text
                        style={[
                          styles.dealCountBadge,
                          selectedStores.has(storeData.name) &&
                            styles.dealCountBadgeSelected,
                        ]}
                      >
                        {storeData.dealCount}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {!storeSearch && displayedStores.length < stores.length && (
                  <Button
                    mode="outlined"
                    onPress={loadMoreStores}
                    style={styles.loadMoreButton}
                  >
                    Załaduj więcej ({stores.length - displayedStores.length}{" "}
                    pozostało)
                  </Button>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.counter}>
          {step === 1
            ? `Wybrano: ${selectedProducts.size}`
            : `Wybrano: ${selectedStores.size}`}
        </Text>

        <View style={styles.buttonContainer}>
          {step === 2 && (
            <Button
              mode="outlined"
              onPress={() => setStep(1)}
              style={styles.backButton}
            >
              Wstecz
            </Button>
          )}
          <Button
            mode="contained"
            onPress={step === 1 ? () => setStep(2) : handleFinish}
            disabled={
              step === 1
                ? selectedProducts.size === 0
                : selectedStores.size === 0 || loading
            }
            style={styles.nextButton}
            loading={loading}
          >
            {step === 1 ? "Dalej" : "Zakończ"}
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  customInput: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: "#2e7d32",
    borderRadius: 12,
    width: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  chipSelected: {
    backgroundColor: "#2e7d32",
    borderColor: "#2e7d32",
  },
  chipText: {
    fontSize: 14,
    color: "#333",
    textTransform: "capitalize",
  },
  chipTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  dealCountBadge: {
    fontSize: 11,
    color: "#666",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    fontWeight: "600",
  },
  dealCountBadgeSelected: {
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  loadMoreButton: {
    marginTop: 16,
  },
  footer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  counter: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
  },
});
