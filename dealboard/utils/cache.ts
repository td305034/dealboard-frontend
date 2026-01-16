import { TokenCache } from "@/types/TokenCache";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const createTokenCache = (): TokenCache => {
  return {
    getToken: async (key: string) => {
      try {
        const item = await SecureStore.getItemAsync(key);
        if (!item) {
          console.warn("We don't have a cached session");
        } else {
          console.warn("Session restored from cache");
        }
        return item;
      } catch (e) {
        await SecureStore.deleteItemAsync(key);
        return null;
      }
    },
    saveToken: async (key: string, token: string) => {
      return await SecureStore.setItemAsync(key, token);
    },
    deleteToken: async (key: string) => {
      return SecureStore.deleteItemAsync(key);
    },
  };
};

// Web tokenCache using localStorage
const createWebTokenCache = (): TokenCache => {
  return {
    getToken: async (key: string) => {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.error("Error getting token from localStorage:", e);
        return null;
      }
    },
    saveToken: async (key: string, token: string) => {
      try {
        localStorage.setItem(key, token);
      } catch (e) {
        console.error("Error saving token to localStorage:", e);
      }
    },
    deleteToken: async (key: string) => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error("Error deleting token from localStorage:", e);
      }
    },
  };
};

export const tokenCache =
  Platform.OS === "web" ? createWebTokenCache() : createTokenCache();
