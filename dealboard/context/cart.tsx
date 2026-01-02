import React, { createContext, useContext, useState, useEffect } from "react";
import { Deal } from "@/types/Deal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./auth";

type CartContextType = {
  cartItems: Deal[];
  addToCart: (deal: Deal) => void;
  removeFromCart: (dealId: number) => void;
  clearCart: () => void;
  isInCart: (dealId: number) => boolean;
  cartCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = "user_cart";

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<Deal[]>([]);
  const { user } = useAuth();

  // Load cart from storage on mount and when user changes
  useEffect(() => {
    const loadCart = async () => {
      if (!user) {
        // User logged out - clear cart
        setCartItems([]);
        return;
      }

      try {
        const cartKey = `${CART_STORAGE_KEY}_${user.email}`;
        const savedCart = await AsyncStorage.getItem(cartKey);
        if (savedCart) {
          setCartItems(JSON.parse(savedCart));
        }
      } catch (error) {
        console.error("Error loading cart:", error);
      }
    };

    loadCart();
  }, [user]);

  // Save cart to storage whenever it changes
  useEffect(() => {
    const saveCart = async () => {
      if (!user) return;

      try {
        const cartKey = `${CART_STORAGE_KEY}_${user.email}`;
        await AsyncStorage.setItem(cartKey, JSON.stringify(cartItems));
      } catch (error) {
        console.error("Error saving cart:", error);
      }
    };

    saveCart();
  }, [cartItems, user]);

  const addToCart = (deal: Deal) => {
    if (!deal.id) return;

    setCartItems((prev) => {
      // Check if already in cart
      if (prev.some((item) => item.id === deal.id)) {
        return prev;
      }
      return [...prev, deal];
    });
  };

  const removeFromCart = (dealId: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== dealId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const isInCart = (dealId: number) => {
    return cartItems.some((item) => item.id === dealId);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
        cartCount: cartItems.length,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
