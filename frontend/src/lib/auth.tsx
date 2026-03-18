import { createContext, useContext, useEffect, useState } from "react";

export type AuthUser = {
  id: number;
  fullName: string;
  role: string;
  defaultLocationId?: number | null;
};

export const DEMO_USERS: AuthUser[] = [
  {
    id: 1,
    fullName: "Администратор",
    role: "administrator",
    defaultLocationId: 1
  },
  {
    id: 2,
    fullName: "Оператор Аеродром 1",
    role: "operator",
    defaultLocationId: 1
  },
  {
    id: 3,
    fullName: "Шеф Центар",
    role: "manager",
    defaultLocationId: 2
  }
];

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  loginDemo: (userId?: number) => void;
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

  const loginDemo = (userId = 1) => {
    const nextUser = DEMO_USERS.find((candidate) => candidate.id === userId) ?? DEMO_USERS[0];

    setUser(nextUser);
    setAccessToken("demo-token");
    window.localStorage.setItem(
      "pecenje-auth",
      JSON.stringify({ user: nextUser, accessToken: "demo-token" })
    );
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    window.localStorage.removeItem("pecenje-auth");
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loginDemo, logout }}>
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
