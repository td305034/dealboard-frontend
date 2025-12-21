import React from "react";
import {
  Modal,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Text, Card, IconButton, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCart } from "@/context/cart";
import { Deal } from "@/types/Deal";

type CartModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function CartModal({ visible, onClose }: CartModalProps) {
  const { cartItems, removeFromCart, clearCart } = useCart();

  const renderCartItem = (deal: Deal) => (
    <Card key={deal.id} style={styles.cartItem}>
      <Card.Content style={styles.cardContent}>
        {deal.imageUrl && (
          <Image source={{ uri: deal.imageUrl }} style={styles.itemImage} />
        )}
        <View style={styles.itemDetails}>
          <Text variant="titleMedium" numberOfLines={2}>
            {deal.name}
          </Text>
          <Text variant="bodySmall" style={styles.store}>
            {deal.category}
          </Text>
          {deal.priceValue && (
            <Text variant="bodyLarge" style={styles.price}>
              {deal.priceValue.toFixed(2)} zł
              {deal.unit && ` / ${deal.unit}`}
            </Text>
          )}
          {deal.discountPercentage && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                -{deal.discountPercentage}%
              </Text>
            </View>
          )}
        </View>
        <IconButton
          icon="delete"
          size={24}
          onPress={() => deal.id && removeFromCart(deal.id)}
          iconColor="#e53935"
        />
      </Card.Content>
    </Card>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.title}>
              Koszyk
            </Text>
            <IconButton icon="close" size={24} onPress={onClose} />
          </View>

          <ScrollView style={styles.scrollView}>
            {cartItems.length === 0 ? (
              <View style={styles.emptyCart}>
                <MaterialCommunityIcons
                  name="cart-outline"
                  size={80}
                  color="#ccc"
                />
                <Text variant="bodyLarge" style={styles.emptyText}>
                  Koszyk jest pusty
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  Przesuń oferty w lewo, aby je dodać
                </Text>
              </View>
            ) : (
              <>
                {cartItems.map(renderCartItem)}
                <Button
                  mode="outlined"
                  onPress={clearCart}
                  style={styles.clearButton}
                  textColor="#e53935"
                >
                  Wyczyść koszyk
                </Button>
              </>
            )}
          </ScrollView>

          {cartItems.length > 0 && (
            <View style={styles.footer}>
              <View style={styles.summary}>
                <Text variant="titleMedium">Liczba produktów:</Text>
                <Text variant="titleLarge" style={styles.totalCount}>
                  {cartItems.length}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontWeight: "bold",
  },
  scrollView: {
    padding: 16,
  },
  cartItem: {
    marginBottom: 12,
    elevation: 2,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  store: {
    color: "#666",
    marginTop: 4,
  },
  price: {
    fontWeight: "bold",
    color: "#2e7d32",
    marginTop: 4,
  },
  discountBadge: {
    backgroundColor: "#e53935",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  discountText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  emptyCart: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    color: "#666",
    fontWeight: "bold",
  },
  emptySubtext: {
    marginTop: 8,
    color: "#999",
  },
  clearButton: {
    marginTop: 16,
    marginBottom: 8,
    borderColor: "#e53935",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "white",
  },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalCount: {
    fontWeight: "bold",
    color: "#1976d2",
  },
  checkoutButton: {
    paddingVertical: 4,
  },
});
