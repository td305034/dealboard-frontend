import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
  Platform,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Text, Chip } from "react-native-paper";
import { Deal } from "@/types/Deal";
import { useAuth } from "@/context/auth";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SPRING_TUNNEL, TOKEN_KEY_NAME } from "@/utils/constants";
import { authFetch } from "@/utils/authService";
import DealCard from "@/components/DealCard";
import { Swipeable } from "react-native-gesture-handler";
import { useCart } from "@/context/cart";
import { renderRightActions } from "@/utils/dealService";

type SortOption = "name" | "priceValue" | "discountPercentage";
type SortDirection = "ASC" | "DESC";

function mapRawToDeal(raw: any): Deal {
  return {
    id: raw.id == null ? undefined : Number(raw.id),
    name: String(raw.name),
    store: String(raw.store),
    category: String(raw.category),
    promoNotes: raw.promo_notes ?? null,
    priceValue: raw.price_value == null ? null : Number(raw.price_value),
    priceAlt: raw.price_alt ?? null,
    discountPercentage:
      raw.discount_percent == null ? null : Number(raw.discount_percent),
    imageUrl: raw.imageUrl ?? null,
    unit: raw.unit ?? null,
    validUntil: raw.valid_until ?? null,
    hasNotification: raw.hasNotification ?? false,
  };
}

export default function AllDealsScreen() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  // Sort states
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("ASC");

  // Available options
  const [stores, setStores] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Filter panel visibility
  const [showFilters, setShowFilters] = useState(false);

  const { addToCart } = useCart();

  const swipeableRefs = React.useRef<{
    [key: number]: Swipeable | null;
  }>({});

  useEffect(() => {
    if (user) {
      loadDeals(0, true);
    }
  }, [
    user,
    searchQuery,
    selectedStore,
    selectedCategory,
    minPrice,
    maxPrice,
    sortBy,
    sortDirection,
  ]);

  async function fetchDeals(pageNum: number): Promise<Deal[]> {
    try {
      const params = new URLSearchParams();
      params.append("page", pageNum.toString());
      params.append("size", "20");
      params.append("sort", `${sortBy},${sortDirection}`);

      if (searchQuery.trim()) params.append("name", searchQuery.trim());
      if (selectedStore) params.append("store", selectedStore);
      if (selectedCategory) params.append("category", selectedCategory);
      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);

      const url = `${SPRING_TUNNEL}/api/deals/all?${params.toString()}`;

      const res = await authFetch(url, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
        },
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const raw = JSON.parse(text);

      if (!Array.isArray(raw.content)) throw new Error("Unexpected payload");

      const mapped = raw.content.map(mapRawToDeal);
      const isLastPage = raw.last || raw.content.length < 20;
      setHasMore(!isLastPage);

      // Extract unique stores and categories
      const allStores = new Set(stores);
      const allCategories = new Set(categories);
      mapped.forEach((deal: { store: string; category: string }) => {
        if (deal.store) allStores.add(deal.store);
        if (deal.category) allCategories.add(deal.category);
      });
      setStores(Array.from(allStores));
      setCategories(Array.from(allCategories));

      return mapped;
    } catch (error) {
      console.error("Error fetching all deals:", error);
      return [];
    }
  }

  const loadDeals = async (pageNum: number, reset: boolean = false) => {
    if (loading) return;
    setLoading(true);
    if (reset) {
      setInitialLoading(true);
    }

    try {
      const newDeals = await fetchDeals(pageNum);
      setDeals((prev) => {
        const combined = [...prev, ...newDeals];
        const uniqueDeals = Array.from(
          new Map(
            combined.map((d) => [d.id ?? `${d.name}-${Math.random()}`, d])
          ).values()
        );
        return uniqueDeals;
      });

      setPage(pageNum);
    } catch (error) {
      console.error("Error loading deals:", error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const checkAndLoadMore = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 100;

    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    if (isCloseToBottom && !loading && hasMore) {
      loadDeals(page + 1);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    checkAndLoadMore(event);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStore(null);
    setSelectedCategory(null);
    setMinPrice("");
    setMaxPrice("");
  };

  const toggleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(option);
      setSortDirection("ASC");
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedStore) count++;
    if (selectedCategory) count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    return count;
  };

  function handleAddDealToCart(deal: any) {
    if (!user || !deal.id) return;
    try {
      addToCart(deal);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color="#666"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Szukaj po nazwie..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter toggle button */}
      <TouchableOpacity
        style={styles.filterToggle}
        onPress={() => setShowFilters(!showFilters)}
      >
        <View style={styles.filterToggleLeft}>
          <MaterialCommunityIcons
            name={showFilters ? "chevron-up" : "chevron-down"}
            size={20}
            color="#333"
          />
          <Text style={styles.filterToggleText}>Filtry i sortowanie</Text>
          {getActiveFiltersCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {getActiveFiltersCount()}
              </Text>
            </View>
          )}
        </View>
        {(selectedStore || selectedCategory || minPrice || maxPrice) && (
          <TouchableOpacity
            onPress={clearFilters}
            style={styles.clearIconButton}
          >
            <MaterialCommunityIcons name="close" size={18} color="#d32f2f" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Expandable filters section */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          {/* Sort options */}
          <View style={styles.sortContainer}>
            <Text style={styles.sectionLabel}>Sortuj:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy === "name" && styles.sortButtonActive,
                ]}
                onPress={() => toggleSort("name")}
              >
                <Text
                  style={[
                    styles.sortButtonText,
                    sortBy === "name" && styles.sortButtonTextActive,
                  ]}
                >
                  Nazwa
                </Text>
                {sortBy === "name" && (
                  <MaterialCommunityIcons
                    name={sortDirection === "ASC" ? "arrow-up" : "arrow-down"}
                    size={16}
                    color="#2e7d32"
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy === "priceValue" && styles.sortButtonActive,
                ]}
                onPress={() => toggleSort("priceValue")}
              >
                <Text
                  style={[
                    styles.sortButtonText,
                    sortBy === "priceValue" && styles.sortButtonTextActive,
                  ]}
                >
                  Cena
                </Text>
                {sortBy === "priceValue" && (
                  <MaterialCommunityIcons
                    name={sortDirection === "ASC" ? "arrow-up" : "arrow-down"}
                    size={16}
                    color="#2e7d32"
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy === "discountPercentage" && styles.sortButtonActive,
                ]}
                onPress={() => toggleSort("discountPercentage")}
              >
                <Text
                  style={[
                    styles.sortButtonText,
                    sortBy === "discountPercentage" &&
                      styles.sortButtonTextActive,
                  ]}
                >
                  Zniżka
                </Text>
                {sortBy === "discountPercentage" && (
                  <MaterialCommunityIcons
                    name={sortDirection === "ASC" ? "arrow-up" : "arrow-down"}
                    size={16}
                    color="#2e7d32"
                  />
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Price filters */}
          <View>
            <Text>Cena:</Text>
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                marginTop: 8,
                marginBottom: 12,
              }}
            >
              <TextInput
                style={styles.priceInput}
                placeholder="Min"
                value={minPrice}
                onChangeText={setMinPrice}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
              <Text style={styles.priceSeparator}>-</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Max"
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Store filter */}
          {stores.length > 0 && (
            <View style={styles.filterContainer}>
              <Text style={styles.sectionLabel}>Sklep:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {stores.map((store) => (
                  <Chip
                    key={store}
                    selected={selectedStore === store}
                    onPress={() =>
                      setSelectedStore(selectedStore === store ? null : store)
                    }
                    style={[
                      styles.chip,
                      selectedStore === store && styles.chipSelected,
                    ]}
                    textStyle={[
                      styles.chipText,
                      selectedStore === store && styles.chipTextSelected,
                    ]}
                  >
                    {store}
                  </Chip>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Category filter */}
          {categories.length > 0 && (
            <View style={styles.filterContainer}>
              <Text style={styles.sectionLabel}>Kategoria:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((category) => (
                  <Chip
                    key={category}
                    selected={selectedCategory === category}
                    onPress={() =>
                      setSelectedCategory(
                        selectedCategory === category ? null : category
                      )
                    }
                    style={[
                      styles.chip,
                      selectedCategory === category && styles.chipSelected,
                    ]}
                    textStyle={[
                      styles.chipText,
                      selectedCategory === category && styles.chipTextSelected,
                    ]}
                  >
                    {category}
                  </Chip>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Clear filters button */}
          {(selectedStore || selectedCategory || minPrice || maxPrice) && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={clearFilters}
            >
              <MaterialCommunityIcons
                name="filter-off"
                size={18}
                color="#d32f2f"
              />
              <Text style={styles.clearFiltersButtonText}>
                Wyczyść wszystkie filtry
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Deals list */}
      {initialLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7d32" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          onMomentumScrollEnd={checkAndLoadMore}
          onScrollEndDrag={checkAndLoadMore}
          scrollEventThrottle={400}
          style={styles.dealsList}
        >
          {deals?.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="package-variant"
                size={64}
                color="#ccc"
              />
              <Text style={styles.emptyStateText}>Brak promocji</Text>
            </View>
          ) : (
            deals?.map((deal, index) => (
              <Swipeable
                key={deal.id ?? `deal-${index}`}
                ref={(ref) => {
                  if (deal.id != null) swipeableRefs.current[deal.id] = ref;
                }}
                overshootLeft={false}
                overshootRight={false}
                renderRightActions={() => renderRightActions()}
                onSwipeableOpen={(direction) => {
                  direction == "right" ? handleAddDealToCart(deal) : null;
                  if (deal.id != null) swipeableRefs.current[deal.id!]?.close();
                }}
              >
                <DealCard deal={deal} isCheapest={false} />
              </Swipeable>
            ))
          )}

          {loading && !initialLoading && (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#2e7d32" />
              <Text style={styles.loadingText}>
                ładowanie kolejnych ofert...
              </Text>
            </View>
          )}

          {!hasMore && deals.length > 0 && (
            <View style={styles.endMessage}>
              <Text style={styles.endMessageText}>Koniec ofert</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F5F5F5",
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  filterToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterToggleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  filterBadge: {
    backgroundColor: "#333",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  clearIconButton: {
    padding: 4,
  },
  filtersPanel: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1a1a1a",
  },
  sortContainer: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    gap: 6,
  },
  sortButtonActive: {
    backgroundColor: "#e8f5e9",
    borderColor: "#2e7d32",
  },
  sortButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  sortButtonTextActive: {
    color: "#2e7d32",
    fontWeight: "600",
  },
  priceInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1a1a1a",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  priceSeparator: {
    fontSize: 16,
    color: "#666",
    fontWeight: "bold",
  },
  filterContainer: {
    marginBottom: 12,
  },
  chip: {
    marginRight: 8,
    backgroundColor: "#fff",
  },
  chipSelected: {
    backgroundColor: "#e3f2fd",
  },
  chipText: {
    fontSize: 12,
    color: "#666",
  },
  chipTextSelected: {
    color: "#1565c0",
    fontWeight: "600",
  },
  clearFiltersButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffebee",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  clearFiltersButtonText: {
    color: "#d32f2f",
    fontSize: 14,
    fontWeight: "600",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffebee",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  clearButtonText: {
    color: "#d32f2f",
    fontSize: 14,
    fontWeight: "600",
  },
  dealsList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateText: {
    color: "#999",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: "#666",
    fontSize: 14,
  },
  endMessage: {
    paddingVertical: 20,
    alignItems: "center",
  },
  endMessageText: {
    color: "#999",
    fontSize: 14,
    fontStyle: "italic",
  },
});
