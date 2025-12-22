import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
} from "react-native";
import { Text, Card } from "react-native-paper";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { Deal } from "@/types/Deal";
import { useAuth } from "@/context/auth";
import { useCart } from "@/context/cart";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SPRING_TUNNEL, TOKEN_KEY_NAME } from "@/utils/constants";
import { tokenCache } from "@/utils/cache";
import { authFetch } from "@/utils/authService";

export default function DealsScreen() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [deals, setDeals] = React.useState<Deal[]>([]);
  const [hidden, setHidden] = React.useState<number[]>([]);
  const [page, setPage] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const swipeableRefs = React.useRef<{
    [key: number]: Swipeable | null;
  }>({});

  useEffect(() => {
    if (user) {
      loadDeals(0, true);
    }
  }, [user]);

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
    };
  }

  async function fetchUserDeals(pageNum: number): Promise<Deal[]> {
    try {
      const token = await tokenCache?.getToken(TOKEN_KEY_NAME);
      const url = `${SPRING_TUNNEL}/api/deals/mine?page=${pageNum}&size=20`;
      const res = await authFetch(url, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "omit",
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

      return mapped;
    } catch (error) {
      console.error("Error fetching deals:", error);
      return [];
    }
  }

  const loadDeals = async (pageNum: number, reset: boolean = false) => {
    if (loading) return;
    console.log("Loading deals for page:", pageNum);
    setLoading(true);
    if (reset) {
      setInitialLoading(true);
    }

    try {
      const newDeals = await fetchUserDeals(pageNum);

      // const visibleDeals = newDeals.filter(
      //   (deal) => !hidden.includes(deal.id!)
      // );

      // setDeals((prev) => (reset ? visibleDeals : [...prev, ...visibleDeals]));

      setDeals((prev) => (reset ? newDeals : [...prev, ...newDeals]));
      setPage(pageNum);
    } catch (error) {
      console.error("Error loading deals:", error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;

    // Check if user scrolled to bottom
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    if (isCloseToBottom && !loading && hasMore) {
      loadDeals(page + 1);
    }
  };

  const handleHideDeal = async (id: number) => {
    try {
      setHidden((prev) => [...prev, id]);
    } catch (error) {
      console.error(error);
    } finally {
      loadDeals(0, true);
    }
  };

  const handleAddDealToCart = async (deal: Deal) => {
    if (!user || !deal.id) return;
    try {
      addToCart(deal);
    } catch (error) {
      console.error(error);
    }
  };

  const renderLeftActions = () => {
    return (
      <View style={styles.swipeActionRight}>
        <MaterialCommunityIcons
          name="eye-off-outline"
          size={32}
          color={"#fff"}
        ></MaterialCommunityIcons>
      </View>
    );
  };
  const renderRightActions = () => {
    return (
      <View style={styles.swipeActionLeft}>
        <MaterialCommunityIcons
          name="shopping-outline"
          size={32}
          color={"#fff"}
        ></MaterialCommunityIcons>
      </View>
    );
  };

  const isDealHidden = (id: number) => hidden.includes(id);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Aktualne promocje</Text>
      </View>

      {initialLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7d32" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={400}
        >
          {deals?.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No deals for today.</Text>
            </View>
          ) : (
            deals?.map((deal, key) => (
              <Swipeable
                ref={(ref) => {
                  swipeableRefs.current[deal.id!] = ref;
                }}
                key={key}
                overshootLeft={false}
                overshootRight={false}
                renderLeftActions={renderLeftActions}
                renderRightActions={() => renderRightActions()}
                onSwipeableOpen={(direction) => {
                  direction == "right"
                    ? handleAddDealToCart(deal)
                    : handleHideDeal(deal.id!);
                  swipeableRefs.current[deal.id!]?.close();
                }}
              >
                <Card style={[styles.card]}>
                  <View style={styles.cardView}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {deal.name}
                      </Text>
                      <View style={styles.priceContainer}>
                        <Text style={styles.priceValue}>
                          {deal.priceValue !== null &&
                          deal.priceValue !== undefined
                            ? `${deal.priceValue.toFixed(2)}zł`
                            : deal.priceAlt || "N/A"}
                        </Text>
                        {deal.unit && (
                          <Text style={styles.priceUnit}>/{deal.unit}</Text>
                        )}
                      </View>
                    </View>

                    {deal.promoNotes && (
                      <Text style={styles.cardDesc} numberOfLines={2}>
                        {deal.promoNotes}
                      </Text>
                    )}

                    <View style={styles.cardFooter}>
                      {deal.category && (
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryText}>
                            {deal.category}
                          </Text>
                        </View>
                      )}
                      {deal.discountPercentage !== null && (
                        <View style={styles.discountBadge}>
                          <MaterialCommunityIcons
                            name="tag"
                            size={14}
                            color="#d32f2f"
                          />
                          <Text style={styles.discountText}>
                            {deal.discountPercentage}% OFF
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.cardFooter}>
                      {deal.store && (
                        <View style={styles.storeBadge}>
                          <Text style={styles.storeText}>{deal.store}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Card>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
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
  swipeActionRight: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    borderRadius: 18,
    marginBottom: 12,
    marginTop: 2,
    paddingLeft: 16,
    backgroundColor: "#e53935",
  },
});
