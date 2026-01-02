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
import { SPRING_TUNNEL, POPULAR_PRODUCTS } from "@/utils/constants";
import { Redirect, router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { authFetch } from "@/utils/authService";
import { SafeAreaView } from "react-native-safe-area-context";
import OnboardingButtons from "@/components/OnboardingButtons";

export default function EditProductsScreen() {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  );
  const [customProduct, setCustomProduct] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    fetchSelectedProducts();
  }, []);

  const fetchSelectedProducts = async () => {
    try {
      const response = await authFetch(
        `${SPRING_TUNNEL}/api/users/selected-products`,
        {
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (response.ok) {
        const productsData = await response.json();
        const productsArray = productsData.products || productsData;
        setSelectedProducts(new Set(productsArray));
      } else {
        console.error("Failed to fetch selected products:", response.status);
        const errorText = await response.text();
        console.error("Error response for products:", errorText);
      }
    } catch (error) {
      console.error("Error fetching selected products:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  const toggleProduct = (product: string) => {
    setHasChanged(true);
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

  const addCustomProduct = () => {
    if (customProduct.trim()) {
      toggleProduct(customProduct.trim().toLowerCase());
      setCustomProduct("");
    }
  };

  const handleSave = async () => {
    if (selectedProducts.size === 0) {
      alert("Wybierz przynajmniej jeden produkt!");
      return;
    }

    setLoading(true);
    try {
      const response = await authFetch(
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

      if (!response.ok) {
        throw new Error("Failed to save products");
      }

      router.back();
    } catch (error) {
      console.error("Error saving products:", error);
      alert("Wystąpił błąd podczas zapisywania produktów");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (selectedProducts.size === 0) {
      alert("Wybierz przynajmniej jeden produkt!");
      return;
    }
    router.replace({
      pathname: "/edit-stores",
      params: {
        selectedProducts: JSON.stringify(Array.from(selectedProducts)),
      },
    });
    return;
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
          Moje produkty
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Wybrane: {selectedProducts.size}
        </Text>

        <View style={styles.customProductContainer}>
          <TextInput
            style={styles.customProductInput}
            placeholder="Dodaj własny produkt..."
            value={customProduct}
            onChangeText={setCustomProduct}
            onSubmitEditing={addCustomProduct}
          />
          <TouchableOpacity style={styles.addButton} onPress={addCustomProduct}>
            <MaterialCommunityIcons name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.productsGrid}>
          {POPULAR_PRODUCTS.map((product) => (
            <TouchableOpacity
              key={product}
              style={[
                styles.productChip,
                selectedProducts.has(product) && styles.productChipSelected,
              ]}
              onPress={() => toggleProduct(product)}
            >
              <Text
                style={[
                  styles.productText,
                  selectedProducts.has(product) && styles.productTextSelected,
                ]}
              >
                {product}
              </Text>
              {selectedProducts.has(product) && (
                <MaterialCommunityIcons name="check" size={16} color="#fff" />
              )}
            </TouchableOpacity>
          ))}

          {Array.from(selectedProducts)
            .filter((p) => !POPULAR_PRODUCTS.includes(p))
            .map((product) => (
              <TouchableOpacity
                key={product}
                style={[styles.productChip, styles.productChipSelected]}
                onPress={() => toggleProduct(product)}
              >
                <Text style={styles.productTextSelected}>{product}</Text>
                <MaterialCommunityIcons name="check" size={16} color="#fff" />
              </TouchableOpacity>
            ))}
        </View>

        <OnboardingButtons
          onPrimaryPress={handleSave}
          onSecondaryPress={() => router.back()}
          onAlternativePress={handleNext}
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
  customProductContainer: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 10,
  },
  customProductInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  addButton: {
    backgroundColor: "#7868f5ff",
    borderRadius: 8,
    width: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  productChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  productChipSelected: {
    backgroundColor: "#7868f5ff",
    borderColor: "#7868f5ff",
  },
  productText: {
    color: "#333",
  },
  productTextSelected: {
    color: "#fff",
    fontWeight: "500",
  },
  button: {
    flex: 1,
  },
});
