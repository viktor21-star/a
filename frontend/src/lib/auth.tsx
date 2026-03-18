import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";
import type { ApiEnvelope, LoginRequest, LoginResponse } from "./types";

export type AuthUser = {
  id: number;
  fullName: string;
  role: string;
  defaultLocationId?: number | null;
  permissions?: string[];
};

export function isAdministrator(user: AuthUser | null) {
  return user?.role === "administrator";
}

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem("pecenje-auth");
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { user: AuthUser; accessToken: string };
      setUser(parsed.user);
      setAccessToken(parsed.accessToken);
    } catch {
      window.localStorage.removeItem("pecenje-auth");
    }
  }, []);

  const login = async (credentials: LoginRequest) => {
    const response = await api.login<ApiEnvelope<LoginResponse>>(credentials);
    const nextUser: AuthUser = {
      id: response.data.user.id,
      fullName: response.data.user.fullName,
      role: response.data.user.role,
      defaultLocationId: response.data.user.defaultLocationId,
      permissions: response.data.user.permissions
    };

    setUser(nextUser);
    setAccessToken(response.data.accessToken);
    window.localStorage.setItem(
      "pecenje-auth",
      JSON.stringify({ user: nextUser, accessToken: response.data.accessToken })
    );
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    window.localStorage.removeItem("pecenje-auth");
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("AuthProvider is missing.");
  }

  return context;
}
