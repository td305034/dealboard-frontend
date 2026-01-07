import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Text } from "react-native-paper";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { Deal, GroupedDeal } from "@/types/Deal";
import { useAuth } from "@/context/auth";
import { useCart } from "@/context/cart";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SPRING_TUNNEL, TOKEN_KEY_NAME } from "@/utils/constants";
import { tokenCache } from "@/utils/cache";
import { authFetch } from "@/utils/authService";
import DealCard from "@/components/DealCard";
import { useFocusEffect } from "@react-navigation/native";
import { renderRightActions } from "@/utils/dealService";

interface RecommendedStore {
  name: string;
  dealCount: number;
}

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

export default function DealsScreen() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [deals, setDeals] = React.useState<GroupedDeal[]>([]);
  const [hidden, setHidden] = React.useState<number[]>([]);
  const [page, setPage] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [recommendedStore, setRecommendedStore] =
    React.useState<RecommendedStore | null>(null);
  const [collapsedKeywords, setCollapsedKeywords] = React.useState<Set<string>>(
    new Set()
  );
  const [scrollViewHeight, setScrollViewHeight] = React.useState(0);
  const swipeableRefs = React.useRef<{
    [key: number]: Swipeable | null;
  }>({});

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadDeals(0, true);
        fetchRecommendedStore();
      }
    }, [user])
  );

  async function fetchRecommendedStore() {
    try {
      const res = await authFetch(
        `${SPRING_TUNNEL}/api/deals/recommended-store`,
        {
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (!res.ok) {
        console.error("Failed to fetch recommended store");
        return;
      }

      const data = await res.json();
      setRecommendedStore(data);
    } catch (error) {
      console.error("Error fetching recommended store:", error);
    }
  }

  async function fetchUserDeals(pageNum: number): Promise<GroupedDeal[]> {
    try {
      const token = await tokenCache?.getToken(TOKEN_KEY_NAME);
      const url = `${SPRING_TUNNEL}/api/deals/mine?page=${pageNum}&size=20`;

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

      if (!Array.isArray(raw.content)) {
        throw new Error("Unexpected payload");
      }

      const mapped: GroupedDeal[] = raw.content.map((item: any) => ({
        keyword: item.keyword,
        deal: mapRawToDeal(item.deal),
        isPrimary: item.isPrimary ?? false,
        isCheapest: item.isCheapest ?? false,
      }));
      setHasMore(!raw.last);

      return mapped;
    } catch (error) {
      console.error("Error fetching deals:", error);
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
      const newDeals = await fetchUserDeals(pageNum);
      setDeals((prev) => {
        if (reset) return newDeals;
        const existingKeys = new Set(
          prev.map((item) => `${item.keyword}_${item.deal.id}`)
        );
        const uniqueNewDeals = newDeals.filter(
          (item) => !existingKeys.has(`${item.keyword}_${item.deal.id}`)
        );
        return [...prev, ...uniqueNewDeals];
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

  const checkContentHeight = (contentHeight: number) => {
    // Jeśli zawartość jest krótsza niż ekran, automatycznie załaduj więcej
    if (contentHeight < scrollViewHeight && !loading && hasMore) {
      loadDeals(page + 1);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    checkAndLoadMore(event);
  };

  const handleAddDealToCart = async (deal: Deal) => {
    if (!user || !deal.id) return;
    try {
      addToCart(deal);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleKeyword = (keyword: string) => {
    setCollapsedKeywords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(keyword)) {
        newSet.delete(keyword);
      } else {
        newSet.add(keyword);
      }
      return newSet;
    });
  };

  return (
    <View style={styles.container}>
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
          onLayout={(event) => {
            setScrollViewHeight(event.nativeEvent.layout.height);
          }}
          onContentSizeChange={(_, contentHeight) => {
            checkContentHeight(contentHeight);
          }}
        >
          {recommendedStore && (
            <View style={styles.recommendedContainer}>
              <Text style={styles.recommendedText}>
                Polecany sklep dzisiaj:{"\n"}
                <Text style={styles.storeName}>
                  {recommendedStore.name}
                </Text>{" "}
                <Text style={styles.dealCount}>
                  ({recommendedStore.dealCount}{" "}
                  {recommendedStore.dealCount === 1 ? "oferta" : "ofert"})
                </Text>
              </Text>
            </View>
          )}
          {deals?.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No deals for today.</Text>
            </View>
          ) : (
            deals?.map((item) => {
              const isCollapsed = collapsedKeywords.has(item.keyword);
              const shouldShow = item.isPrimary || !isCollapsed;
              const uniqueKey = `${item.keyword}_${item.deal.id}_${item.isPrimary}`;

              return (
                <React.Fragment key={uniqueKey}>
                  {item.isPrimary && (
                    <TouchableOpacity
                      onPress={() => toggleKeyword(item.keyword)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.primaryLabelContainer}>
                        <Text style={styles.primaryLabel}>
                          {item.keyword.charAt(0).toUpperCase() +
                            item.keyword.slice(1)}
                        </Text>
                        <MaterialCommunityIcons
                          name={isCollapsed ? "chevron-down" : "chevron-up"}
                          size={20}
                          color="#fff"
                        />
                      </View>
                    </TouchableOpacity>
                  )}
                  {shouldShow && (
                    <Swipeable
                      ref={(ref) => {
                        swipeableRefs.current[item.deal.id!] = ref;
                      }}
                      overshootLeft={false}
                      overshootRight={false}
                      renderRightActions={() => renderRightActions()}
                      onSwipeableOpen={(direction) => {
                        direction == "right"
                          ? handleAddDealToCart(item.deal)
                          : null;
                        swipeableRefs.current[item.deal.id!]?.close();
                      }}
                      key={`${item.keyword}_${item.deal.id}`}
                    >
                      <DealCard deal={item.deal} isCheapest={item.isCheapest} />
                    </Swipeable>
                  )}
                </React.Fragment>
              );
            })
          )}

          {loading && !initialLoading && (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#2e7d32" />
              <Text style={styles.loadingText}>
                Ładowanie kolejnych ofert...
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
  headerContainer: {
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recommendedContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 10,
  },
  starIcon: {
    marginRight: 6,
  },
  recommendedText: {
    fontSize: 20,
    color: "black",
    flex: 1,
  },
  storeName: {
    fontWeight: "700",
    color: "#261796ff",
    fontSize: 36,
  },
  dealCount: {
    fontSize: 20,
    color: "#999",
  },
  title: {
    fontWeight: "bold",
  },
  card: {
    marginBottom: 12,
    paddingHorizontal: 0,
    borderRadius: 12,
    backgroundColor: "#e6eeff",

    //elevation for web (and iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,

    //elevation for android
    elevation: 5,
  },
  cardView: {
    marginHorizontal: -8,
    marginVertical: -4,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    lineHeight: 24,
    paddingLeft: 4,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  priceUnit: {
    fontSize: 14,
    color: "#666",
    marginLeft: 2,
  },
  cardDesc: {
    fontSize: 14,
    marginBottom: 12,
    color: "#666",
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  categoryBadge: {
    backgroundColor: "#e3f2fd",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  storeBadge: {
    backgroundColor: "#d3deffff",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  storeText: {
    fontSize: 12,
    color: "#04002fff",
    fontWeight: "600",
  },
  categoryText: {
    fontSize: 12,
    color: "#1565c0",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  discountBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffebee",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  discountText: {
    fontSize: 12,
    color: "#d32f2f",
    fontWeight: "700",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    elevation: 1,
  },
  streakText: {
    marginLeft: 6,
    color: "#be7200ff",
  },
  freqBadge: {
    backgroundColor: "#bbd0ffff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    elevation: 1,
    justifyContent: "center",
  },
  freqText: {
    color: "#2b5dc7ff",
    textTransform: "capitalize",
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    color: "#666",
  },
  primaryLabel: {
    backgroundColor: "#6451f1ff",
    color: "#fff",
    padding: 8,
    marginBottom: 4,
    fontWeight: "bold",
    fontSize: 16,
    borderRadius: 8,
    flex: 1,
  },
  primaryLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6451f1ff",
    padding: 6,
    marginBottom: 10,
    marginTop: 6,
    borderRadius: 8,
    gap: 8,
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
