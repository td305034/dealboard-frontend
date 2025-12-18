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
  SPRING_TUNNEL,
  TOKEN_KEY_NAME,
} from "@/utils/constants";
import { Platform } from "react-native";
import { tokenCache } from "@/utils/cache";
import * as jose from "jose";

// Only complete auth session on web - Expo Router handles deep links on native
if (Platform.OS === "web") {
  WebBrowser.maybeCompleteAuthSession();
}

export type AuthUser = {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  email_verified?: boolean;
  provider?: string;
  exp?: number;
  cookieExpiration?: number;
};

const AuthContext = React.createContext({
  isAuthenticated: false,
  user: null as AuthUser | null,
  signIn: () => {},
  signInWithEmail: async (email: string, password: string) => {},
  signUp: async (email: string, password: string, name: string) => {},
  signOut: () => {},
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
  // redirectUri:
  //   Platform.OS === "web"
  //     ? makeRedirectUri()
  //     : `${SPRING_TUNNEL}/api/auth/callback`,
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

    // Create unique ID for this response to prevent duplicate processing
    const responseId = `${response.type}-${Date.now()}`;

    // Skip if we already processed this exact response
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
          const storedAccessToken = await tokenCache?.getToken(TOKEN_KEY_NAME);
          if (storedAccessToken) {
            try {
              const decoded = jose.decodeJwt(storedAccessToken);
              const exp = (decoded as any).exp;
              const currentTime = Math.floor(Date.now() / 1000);

              if (currentTime < exp) {
                setUser(decoded as AuthUser);
                return;
              } else {
                setUser(null);
                tokenCache?.deleteToken(TOKEN_KEY_NAME);
              }
            } catch (e) {
              console.error(e);
            }
          }
        }
      } catch (e) {
        console.error("Error restoring session:", e);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, [isWeb]);
  const handleResponse = async () => {
    console.log("first");
    if (response?.type === "success") {
      const { code } = response.params;

      console.log("Kodzisko: ", code);

      try {
        setIsLoading(true);
        //exchange code for tokens and fetch user info

        const formData = new FormData();
        formData.append("code", code);
        if (isWeb) {
          formData.append("platform", "web");
        } else {
          console.warn("No code verifier found");
        }

        if (request?.codeVerifier) {
          formData.append("code_verifier", request.codeVerifier);
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

          if (!accessToken) {
            console.error("No access token received");
            return;
          }

          tokenCache?.saveToken(TOKEN_KEY_NAME, accessToken);

          console.log("Access Token:", accessToken);

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
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const baseUrl =
        Platform.OS === "android" ? SPRING_TUNNEL : BASE_SPRING_URL;
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: isWeb ? "include" : "same-origin",
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();

      if (isWeb) {
        setUser(data.user);
      } else {
        await tokenCache?.saveToken(TOKEN_KEY_NAME, data.accessToken);
        setUser(data.user);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setError(error as AuthError);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const baseUrl =
        Platform.OS === "android" ? SPRING_TUNNEL : BASE_SPRING_URL;

      console.log("Signing up with:", { name, email, password: "***" });
      console.log("URL:", `${baseUrl}/api/auth/register`);

      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
        credentials: isWeb ? "include" : "same-origin",
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.log("Error response:", errorData);
        throw new Error(
          errorData.message || errorData.error || "Registration failed"
        );
      }

      const data = await response.json();

      if (isWeb) {
        setUser(data.user);
      } else {
        await tokenCache?.saveToken(TOKEN_KEY_NAME, data.accessToken);
        setUser(data.user);
      }
    } catch (error) {
      console.error("Sign up error:", error);
      setError(error as AuthError);
    } finally {
      setIsLoading(false);
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
    }

    setUser(null);
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
