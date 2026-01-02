import { TokenCache } from "@/types/TokenCache";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const createTokenCache = (): TokenCache => {
  return {
    getToken: async (key: string) => {
      try {
        const item = await SecureStore.getItemAsync(key);
        if (!item) {
          //console.log("We don't have a cached session");
        } else {
          //console.log("Session restored from cache");
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

export const tokenCache =
  Platform.OS === "web" ? undefined : createTokenCache();
