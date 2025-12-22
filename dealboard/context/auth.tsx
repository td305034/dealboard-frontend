import * as React from "react";
import * as WebBrowser from "expo-web-browser";
import {
  AuthError,
  AuthRequestConfig,
  DiscoveryDocument,
  makeRedirectUri,
  useAuthRequest,
} from "expo-auth-session";
import {
  BASE_SPRING_URL,
  BASE_URL,
  REFRESH_TOKEN_KEY_NAME,
  SPRING_TUNNEL,
  TOKEN_KEY_NAME,
} from "@/utils/constants";
import { Platform } from "react-native";
import { tokenCache } from "@/utils/cache";
import * as jose from "jose";
import { router } from "expo-router";

// Only complete auth session on web - Expo Router handles deep links on native
if (Platform.OS === "web") {
  WebBrowser.maybeCompleteAuthSession();
}

export type AuthUser = {
  email: string;
  name: string;
  picture?: string;
  provider?: string;
  exp?: number;
  cookieExpiration?: number;
  onboardingCompleted?: boolean;
};

export type FieldErrors = {
  email?: string;
  password?: string;
  name?: string;
  general?: string;
};

const AuthContext = React.createContext({
  isAuthenticated: false,
  user: null as AuthUser | null,
  signIn: () => {},
  signInWithEmail: async (
    email: string,
    password: string
  ): Promise<{ errors?: FieldErrors } | void> => {},
  signUp: async (
    email: string,
    password: string,
    name: string
  ): Promise<{ errors?: FieldErrors } | void> => {},
  signOut: () => {},
  completeOnboarding: async (): Promise<void> => {},
  isLoading: false,
  error: null as AuthError | null,
});

const redirectUri = Platform.select({
  web: "http://localhost:8082/api/auth/callback",
  android: "10.0.2.2",
  ios: "http://localhost:8082/api/auth/callback",
});

const config: AuthRequestConfig = {
  clientId: "google",
  scopes: ["openid", "profile", "email"],
  redirectUri: makeRedirectUri(),
};

const discovery: DiscoveryDocument = {
  authorizationEndpoint: `${
    Platform.OS === "web" ? "http://localhost:8082" : SPRING_TUNNEL
  }/api/auth/authorize`,
  tokenEndpoint: `${
    Platform.OS === "web" ? "http://localhost:8082" : SPRING_TUNNEL
  }/api/auth/token`,
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<AuthError | null>(null);

  const [request, response, promptAsync] = useAuthRequest(config, discovery);
  const isWeb = Platform.OS === "web";
  const responseRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!response) return;

    const responseId = `${response.type}-${Date.now()}`;

    if (responseRef.current === responseId) {
      console.log("Skipping duplicate response processing");
      return;
    }

    if (response.type === "success" || response.type === "error") {
      responseRef.current = responseId;
      handleResponse();
    }
  }, [response]);

  React.useEffect(() => {
    const restoreSession = async () => {
      setIsLoading(true);
      try {
        if (isWeb) {
          const sessionResponse = await fetch(
            `${BASE_SPRING_URL}/api/auth/session`,
            {
              method: "GET",
              credentials: "include",
            }
          );

          if (sessionResponse.ok) {
            const userData = await sessionResponse.json();
            setUser(userData as AuthUser);
          }
        } else {
          let storedAccessToken = await tokenCache?.getToken(TOKEN_KEY_NAME);
          if (storedAccessToken) {
            try {
              let decoded = jose.decodeJwt(storedAccessToken);
              const exp = (decoded as any).exp;
              const currentTime = Math.floor(Date.now() / 1000);

              if (currentTime >= exp) {
                console.log("Access token expired - attempting refresh");
                const storedRefreshToken = await tokenCache?.getToken(
                  REFRESH_TOKEN_KEY_NAME
                );

                if (!storedRefreshToken) {
                  console.log("No refresh token - clearing session");
                  await tokenCache?.deleteToken(TOKEN_KEY_NAME);
                  setUser(null);
                  return;
                }

                try {
                  const refreshResponse = await fetch(
                    `${SPRING_TUNNEL}/api/auth/refresh`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true",
                      },
                      body: JSON.stringify({
                        refreshToken: storedRefreshToken,
                      }),
                    }
                  );

                  if (!refreshResponse.ok) {
                    console.log(
                      "Refresh token expired or invalid - clearing session"
                    );
                    await tokenCache?.deleteToken(TOKEN_KEY_NAME);
                    await tokenCache?.deleteToken(REFRESH_TOKEN_KEY_NAME);
                    setUser(null);
                    return;
                  }

                  const { accessToken: newAccessToken } =
                    await refreshResponse.json();
                  await tokenCache?.saveToken(TOKEN_KEY_NAME, newAccessToken);
                  storedAccessToken = newAccessToken;
                  decoded = jose.decodeJwt(newAccessToken);
                  console.log("Access token refreshed successfully");
                } catch (refreshError) {
                  console.error("Error refreshing token:", refreshError);
                  await tokenCache?.deleteToken(TOKEN_KEY_NAME);
                  await tokenCache?.deleteToken(REFRESH_TOKEN_KEY_NAME);
                  setUser(null);
                  return;
                }
              }

              try {
                const verifyResponse = await fetch(
                  `${SPRING_TUNNEL}/api/auth/verify`,
                  {
                    headers: {
                      "ngrok-skip-browser-warning": "true",
                      Authorization: `Bearer ${storedAccessToken}`,
                    },
                  }
                );

                if (
                  verifyResponse.status === 401 ||
                  verifyResponse.status === 403 ||
                  verifyResponse.status === 404
                ) {
                  console.log("User not found in database - clearing session");
                  await tokenCache?.deleteToken(TOKEN_KEY_NAME);
                  await tokenCache?.deleteToken(REFRESH_TOKEN_KEY_NAME);
                  setUser(null);
                  return;
                }

                if (!verifyResponse.ok) {
                  throw new Error(
                    `Verification failed: ${verifyResponse.status}`
                  );
                }
                const verifyData = await verifyResponse.json();

                const user = decoded as AuthUser;

                setUser(user);
              } catch (verifyError) {
                console.error("Error verifying user:", verifyError);

                if (
                  verifyError instanceof Error &&
                  verifyError.message.includes("401")
                ) {
                  await tokenCache?.deleteToken(TOKEN_KEY_NAME);
                  await tokenCache?.deleteToken(REFRESH_TOKEN_KEY_NAME);
                  setUser(null);
                } else {
                  // Network error - allow cached session
                  setUser(decoded as AuthUser);
                }
              }
            } catch (e) {
              console.error("Error decoding token:", e);
              await tokenCache?.deleteToken(TOKEN_KEY_NAME);
              await tokenCache?.deleteToken(REFRESH_TOKEN_KEY_NAME);
              setUser(null);
            }
          }
        }
      } catch (e) {
        console.error("Error restoring session:", e);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, [isWeb]);
  const handleResponse = async () => {
    if (response?.type === "success") {
      const { code } = response.params;
      try {
        setIsLoading(true);

        const formData = new FormData();
        formData.append("code", code);
        if (isWeb) {
          formData.append("platform", "web");
        }

        if (request?.codeVerifier) {
          formData.append("code_verifier", request.codeVerifier);
        } else if (!isWeb) {
          console.warn("No code verifier found for native platform");
        }

        const tokenResponse = await fetch(
          `${isWeb ? BASE_SPRING_URL : SPRING_TUNNEL}/api/auth/token`,
          {
            method: "POST",
            body: formData,
            credentials: isWeb ? "include" : "same-origin",
          }
        );
        if (isWeb) {
          const userData = await tokenResponse.json();

          if (userData.success) {
            const sessionResponse = await fetch(
              `${BASE_SPRING_URL}/api/auth/session`,
              {
                method: "GET",
                credentials: "include",
              }
            );
            if (sessionResponse.ok) {
              const sessionData = await sessionResponse.json();
              setUser(sessionData as AuthUser);
            }
          }
        } else {
          const token = await tokenResponse.json();
          const accessToken = token.accessToken;
          const refreshToken = token.refreshToken;

          if (!accessToken) {
            console.error("No access token received");
            return;
          }
          if (!refreshToken) {
            console.error("No refresh token received");
            return;
          }

          tokenCache?.saveToken(TOKEN_KEY_NAME, accessToken);
          tokenCache?.saveToken(REFRESH_TOKEN_KEY_NAME, refreshToken);

          const decoded = jose.decodeJwt(accessToken);
          setUser(decoded as AuthUser);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    } else if (response?.type === "error") {
      setError(response.error as AuthError);
      console.error("Authentication error", response.error);
    } else {
      console.log("Authentication cancelled or unknown response type");
    }
  };
  const signIn = async () => {
    try {
      if (!request) {
        console.log("No request");
        return;
      }
      await promptAsync();
    } catch (err) {
      console.error("Error during sign-in", err);
    }
  };
  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<{ errors?: FieldErrors } | void> => {
    try {
      setError(null);
      const baseUrl =
        Platform.OS === "android" ? SPRING_TUNNEL : BASE_SPRING_URL;
      const response = await fetch(`${baseUrl}/api/auth/authenticate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: isWeb ? "include" : "same-origin",
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (errorData.fieldErrors) {
          return { errors: errorData.fieldErrors };
        }

        return {
          errors: {
            general: errorData.message || errorData.error || "Błąd logowania",
          },
        };
      }

      const data = await response.json();

      if (isWeb) {
        const userData = data.user || jose.decodeJwt(data.accessToken);
        setUser(userData as AuthUser);
      } else {
        await tokenCache?.saveToken(TOKEN_KEY_NAME, data.accessToken);
        const userData = jose.decodeJwt(data.accessToken);
        setUser(userData as AuthUser);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setError(error as AuthError);
      return { errors: { general: "Wystąpił nieoczekiwany błąd" } };
    }
  };

  const signUp = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ errors?: FieldErrors } | void> => {
    try {
      setIsLoading(true);
      setError(null);
      const baseUrl =
        Platform.OS === "android" ? SPRING_TUNNEL : BASE_SPRING_URL;

      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
        credentials: isWeb ? "include" : "same-origin",
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log("Error response:", errorData);

        if (errorData.fieldErrors) {
          return { errors: errorData.fieldErrors };
        }
        return {
          errors: {
            general: errorData.message || errorData.error || "Błąd rejestracji",
          },
        };
      }

      const data = await response.json();
      const userData = jose.decodeJwt(data.accessToken);
      setUser(userData as AuthUser);

      if (!isWeb) {
        await tokenCache?.saveToken(TOKEN_KEY_NAME, data.accessToken);
      }
    } catch (error) {
      console.error("Sign up error:", error);
      setError(error as AuthError);
      return { errors: { general: "Wystąpił nieoczekiwany błąd" } };
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async (): Promise<void> => {
    try {
      const baseUrl =
        Platform.OS === "android" ? SPRING_TUNNEL : BASE_SPRING_URL;
      const isWeb = Platform.OS === "web";

      if (isWeb) {
        // Web: backend aktualizuje sesję cookie
        const response = await fetch(
          `${baseUrl}/api/user/complete-onboarding`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        if (response.ok) {
          // Pobierz zaktualizowaną sesję
          const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
            method: "GET",
            credentials: "include",
          });

          if (sessionResponse.ok) {
            const userData = await sessionResponse.json();
            setUser(userData as AuthUser);
          }
        }
      } else {
        const token = await tokenCache?.getToken(TOKEN_KEY_NAME);
        const response = await fetch(
          `${baseUrl}/api/user/complete-onboarding`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();

          if (data.accessToken) {
            await tokenCache?.saveToken(TOKEN_KEY_NAME, data.accessToken);
            const decoded = jose.decodeJwt(data.accessToken);
            setUser(decoded as AuthUser);
          } else {
            setUser((prev) =>
              prev ? { ...prev, onboardingCompleted: true } : null
            );
          }
        }
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
      throw error;
    }
  };

  const signOut = async () => {
    if (isWeb) {
      try {
        await fetch(`${BASE_SPRING_URL}/api/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
      } catch (e) {
        console.error("Error during web logout:", e);
      }
    } else {
      await tokenCache?.deleteToken(TOKEN_KEY_NAME);
      await tokenCache?.deleteToken(REFRESH_TOKEN_KEY_NAME);
    }

    setUser(null);

    router.replace("/sign-in");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        signIn,
        signInWithEmail,
        signUp,
        signOut,
        completeOnboarding,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
