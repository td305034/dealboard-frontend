import React, { useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Card } from "react-native-paper";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { Deal } from "@/types/Deal";
import { useAuth } from "@/context/auth";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SPRING_TUNNEL, TOKEN_KEY_NAME } from "@/utils/constants";
import { tokenCache } from "@/utils/cache";

export default function DealsScreen() {
  const { user, getValidToken } = useAuth();
  const [deals, setDeals] = React.useState<Deal[]>();
  const [hidden, setHidden] = React.useState<number[]>([]);
  const swipeableRefs = React.useRef<{
    [key: number]: Swipeable | null;
  }>({});

  useEffect(() => {
    if (user) {
      fetchUserDeals().then(setDeals);
    }
  }, [user]);

  function mapRawToDeal(raw: any): Deal {
    return {
      id: raw.id == null ? undefined : Number(raw.id),
      name: String(raw.name),
      store: String(raw.store),
      category: String(raw.category),
      description: raw.description ?? null,
      price: raw.price == null ? null : Number(raw.price),
      discountPercentage:
        raw.discountPercentage == null ? null : Number(raw.discountPercentage),
      imageUrl: raw.imageUrl ?? null,
    };
  }

  async function fetchUserDeals(): Promise<Deal[]> {
    try {
      const token = await getValidToken();
      if (!token) {
        console.log("No valid token available");
        return [];
      }
      
      const url = `${SPRING_TUNNEL}/api/deals/mine`;
      console.log("Fetching deals with valid token");
      const res = await fetch(url, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
      console.log("Response status:", res.status);
      console.log("Response headers:", res.headers);

      const text = await res.text();
      console.log("Raw response:", text.substring(0, 200));

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const raw = JSON.parse(text);
      console.log("Parsed deals:", raw);

      if (!Array.isArray(raw)) throw new Error("Unexpected payload");
      const mapped = raw.map(mapRawToDeal);
      console.log("Mapped deals:", mapped);
      return mapped;
    } catch (error) {
      console.error("Error fetching deals:", error);
      return [];
    }
  }

  const handleHideDeal = async (id: number) => {
    try {
      hidden.push(id);
    } catch (error) {
      console.error(error);
    } finally {
      fetchUserDeals().then(setDeals);
    }
  };
  const handleAddDealToCart = async () => {
    if (!user) return;
    try {
      const currentDate = new Date().toISOString();
      //TODO: add to user's cart
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
        <Text style={styles.title}>Today's deals</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
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
                  ? handleAddDealToCart()
                  : handleHideDeal(deal.id!);
                swipeableRefs.current[deal.id!]?.close();
              }}
            >
              <Card style={[styles.card]}>
                <View style={styles.cardView}>
                  <Text style={styles.cardTitle}>{deal.name}</Text>
                  <Text style={styles.cardDesc}>{deal.description}</Text>
                </View>
              </Card>
            </Swipeable>
          ))
        )}
      </ScrollView>
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
  cardCompleted: {
    opacity: 0.5,
  },
  cardView: {
    marginHorizontal: -8,
    marginVertical: -4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  cardDesc: {
    fontSize: 16,
    marginBottom: 24,
    color: "#555",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  },
  emptyStateText: {
    color: "#666",
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
