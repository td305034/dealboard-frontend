import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Card } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Deal } from "@/types/Deal";
import { authFetch } from "@/utils/authService";
import { SPRING_TUNNEL } from "@/utils/constants";
import { productName } from "expo-device";

export default function DealCard(deal: Deal) {
  const [notificationActive, setNotificationActive] = useState(
    deal.hasNotification ?? false
  );

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
          <Text style={styles.cardTitle} numberOfLines={2}>
            {deal.name}
          </Text>
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
            <View style={styles.priceContainer}>
              <Text style={styles.priceValue}>
                {deal.priceValue !== null && deal.priceValue !== undefined
                  ? `${deal.priceValue.toFixed(2)}zł`
                  : deal.priceAlt || "N/A"}
              </Text>
              {deal.unit && <Text style={styles.priceUnit}>/{deal.unit}</Text>}
            </View>
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
              <Text style={styles.categoryText}>{deal.category}</Text>
            </View>
          )}
          {deal.discountPercentage !== null && (
            <View style={styles.discountBadge}>
              <MaterialCommunityIcons name="tag" size={14} color="#d32f2f" />
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
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    lineHeight: 24,
    paddingLeft: 4,
  },
  rightSection: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 6,
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
});
