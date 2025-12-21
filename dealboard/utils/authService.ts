import * as jose from "jose";
import { tokenCache } from "./cache";
import {
  REFRESH_TOKEN_KEY_NAME,
  SPRING_TUNNEL,
  TOKEN_KEY_NAME,
} from "./constants";

export const refreshAccessToken = async () => {
  const refreshToken = await tokenCache?.getToken(REFRESH_TOKEN_KEY_NAME);
  if (!refreshToken) throw new Error("No refresh token");

  const response = await fetch(`${SPRING_TUNNEL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) throw new Error("Refresh failed");

  const { accessToken: newAccessToken } = await response.json();
  await tokenCache?.saveToken(TOKEN_KEY_NAME, newAccessToken);
  return newAccessToken;
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

  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  return fetch(url, options);
};
