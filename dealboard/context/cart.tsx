import React, { createContext, useContext, useState } from "react";
import { Deal } from "@/types/Deal";

type CartContextType = {
  cartItems: Deal[];
  addToCart: (deal: Deal) => void;
  removeFromCart: (dealId: number) => void;
  clearCart: () => void;
  isInCart: (dealId: number) => boolean;
  cartCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<Deal[]>([]);

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
