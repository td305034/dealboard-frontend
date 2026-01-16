import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Card } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Deal } from "@/types/Deal";
import { authFetch } from "@/utils/authService";
import { SPRING_TUNNEL } from "@/utils/constants";

type DealCardProps = {
  deal: Deal;
  isCheapest: boolean;
};

export default function DealCard({ deal, isCheapest }: DealCardProps) {
  const [notificationActive, setNotificationActive] = useState(
    deal.hasNotification ?? false
  );
  const [expandedName, setExpandedName] = useState(false);
  const [expandedPrice, setExpandedPrice] = useState(false);
  const [expandedPromo, setExpandedPromo] = useState(false);

  const toggleNotification = async () => {
    const newState = !notificationActive;
    setNotificationActive(newState);
    await authFetch(`${SPRING_TUNNEL}/api/users/toggle-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({
        productName: deal.name,
        active: newState,
      }),
    });
  };

  return (
    <Card style={styles.card}>
      <View style={styles.cardView}>
        <View style={styles.cardHeader}>
          <TouchableOpacity
            onPress={() => setExpandedName(!expandedName)}
            style={styles.titleContainer}
            activeOpacity={0.7}
          >
            <Text
              style={styles.cardTitle}
              numberOfLines={expandedName ? undefined : 1}
              ellipsizeMode="tail"
            >
              {deal.name}
            </Text>
          </TouchableOpacity>
          <View style={styles.rightSection}>
            <TouchableOpacity
              onPress={toggleNotification}
              style={styles.notificationButton}
            >
              <MaterialCommunityIcons
                name={notificationActive ? "bell" : "bell-outline"}
                size={22}
                color={notificationActive ? "#ff9800" : "#666"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setExpandedPrice(!expandedPrice)}
              activeOpacity={0.7}
              style={[
                styles.priceContainer,
                isCheapest && styles.priceContainerCheapest,
              ]}
            >
              <Text
                style={[
                  isCheapest ? styles.priceValueCheapest : styles.priceValue,
                  styles.priceText,
                ]}
                numberOfLines={expandedPrice ? undefined : 1}
                ellipsizeMode="tail"
              >
                {deal.priceValue !== null && deal.priceValue !== undefined
                  ? `${deal.priceValue.toFixed(2)}zł`
                  : deal.priceAlt || "N/A"}
              </Text>
              {deal.unit && deal.priceValue != null && (
                <Text style={styles.priceUnit} numberOfLines={1}>
                  /{deal.unit}
                </Text>
              )}
              {isCheapest && (
                <MaterialCommunityIcons
                  name="sale"
                  size={22}
                  color="#d32f2f"
                  style={styles.percentIcon}
                />
              )}
            </TouchableOpacity>
            {deal.validUntil && (
              <Text style={styles.dateText}>
                Do: {new Date(deal.validUntil).toLocaleDateString("pl-PL")}
              </Text>
            )}
          </View>
        </View>

        {deal.promoNotes && (
          <TouchableOpacity
            onPress={() => setExpandedPromo(!expandedPromo)}
            activeOpacity={0.7}
            style={styles.promoContainer}
          >
            <View style={{ paddingLeft: 6 }}>
              <Text
                style={styles.cardDesc}
                numberOfLines={expandedPromo ? undefined : 2}
                ellipsizeMode="tail"
              >
                {deal.promoNotes}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.cardFooter}>
          {deal.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{deal.category}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardFooter}>
          {deal.store && (
            <View style={styles.storeBadge}>
              <Text style={styles.storeText}>{deal.store}</Text>
            </View>
          )}
          {deal.discountPercentage !== null && (
            <View style={styles.discountBadge}>
              <MaterialCommunityIcons name="tag" size={14} color="#d32f2f" />
              <Text style={styles.discountText}>
                {deal.discountPercentage}% TANIEJ
              </Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    paddingHorizontal: 0,
    borderRadius: 12,
    backgroundColor: "#e6eeff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
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
  titleContainer: {
    flex: 1,
    maxWidth: "90%",
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    lineHeight: 28,
    paddingLeft: 4,
  },
  rightSection: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 6,
    maxWidth: "50%",
  },
  notificationButton: {
    padding: 4,
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
    maxWidth: "100%",
  },
  priceContainerCheapest: {
    borderWidth: 3,
    borderColor: "#d32f2f",
    backgroundColor: "#ffebee",
    elevation: 4,
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  priceValueCheapest: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#d32f2f",
  },
  priceText: {
    flexShrink: 1,
  },
  priceUnit: {
    fontSize: 14,
    color: "#666",
    marginLeft: 2,
    flexShrink: 0,
  },
  percentIcon: {
    marginLeft: 6,
  },
  dateText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginTop: 4,
  },
  promoContainer: {
    maxWidth: "50%",
  },
  cardDesc: {
    fontSize: 14,
    marginBottom: 12,
    color: "#666",
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    width: "100%",
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
    fontSize: 20,
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
    justifyContent: "space-between",
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
});
