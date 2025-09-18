import React, { createContext, useMemo, useState } from "react";
import { getRoleFromAccessToken } from "../api/jwt";

export type Role = "ADMIN" | "UNIVERSITY" | "STUDENT" | null;

type AuthState = {
  accessToken: string | null;
  role: Role;
  setAuth: (token: string, role?: Role, refresh?: string) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthState>({
  accessToken: null,
  role: null,
  setAuth: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem("access_token")
  );

  // ✅ fix here
  const [role, setRole] = useState<Role>(() => {
    const saved = localStorage.getItem("role") as Role | null;
    if (saved) return saved;

    const token = localStorage.getItem("access_token");
    if (token) {
      return getRoleFromAccessToken(token) ?? null; // ✅ ensure null, not undefined
    }
    return null;
  });

  const setAuth = (token: string, r?: Role, refresh?: string) => {
    setAccessToken(token);
    localStorage.setItem("access_token", token);

    if (refresh) localStorage.setItem("refresh_token", refresh);

    const finalRole: Role = r ?? getRoleFromAccessToken(token) ?? null;
    setRole(finalRole);
    if (finalRole) localStorage.setItem("role", finalRole);
  };

  const logout = () => {
    setAccessToken(null);
    setRole(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("role");
  };

  const value = useMemo(
    () => ({ accessToken, role, setAuth, logout }),
    [accessToken, role]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};
