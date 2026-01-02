import * as jose from "jose";
import { tokenCache } from "./cache";
import {
  BASE_SPRING_URL,
  REFRESH_TOKEN_KEY_NAME,
  SPRING_TUNNEL,
  TOKEN_KEY_NAME,
} from "./constants";
import { Platform } from "react-native";

export const refreshAccessToken = async () => {
  const isWeb = Platform.OS === "web";
  const refreshToken = await tokenCache?.getToken(REFRESH_TOKEN_KEY_NAME);
  if (!refreshToken) throw new Error("No refresh token");

  const response = await fetch(
    `${isWeb ? BASE_SPRING_URL : SPRING_TUNNEL}/api/auth/refresh`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    }
  );

  if (!response.ok) throw new Error("Refresh failed");

  const data = await response.json();
  await tokenCache?.saveToken(TOKEN_KEY_NAME, data.accessToken);
  return data.accessToken;
};

export const authFetch = async (url: string, options: RequestInit = {}) => {
  let token = await tokenCache?.getToken(TOKEN_KEY_NAME);
  let isTokenValid = false;

  if (token) {
    try {
      const decoded = jose.decodeJwt(token);
      const exp = decoded.exp!;
      isTokenValid = Date.now() / 1000 < exp;
    } catch {
      isTokenValid = false;
    }
  }

  if (!isTokenValid) {
    token = await refreshAccessToken();
  }

  if (!token) {
    throw new Error("No valid authentication token available");
  }

  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  return fetch(url, options);
};

export const registerPushToken = async (pushToken: string) => {
  const isWeb = Platform.OS === "web";
  try {
    const response = await authFetch(
      `${isWeb ? BASE_SPRING_URL : SPRING_TUNNEL}/api/users/register-push-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ token: pushToken }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
    }
  } catch (error) {
    // Silent fail
  }
};
