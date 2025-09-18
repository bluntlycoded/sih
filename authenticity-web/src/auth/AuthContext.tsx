import React, { createContext, useMemo, useState } from "react";

type Role = "ADMIN" | "UNIVERSITY" | "STUDENT" | null;

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem("access_token")
  );
  const [role, setRole] = useState<Role>(
    (localStorage.getItem("role") as Role) || null
  );

  const setAuth = (token: string, r?: Role, refresh?: string) => {
    setAccessToken(token);
    localStorage.setItem("access_token", token);
    if (refresh) localStorage.setItem("refresh_token", refresh);
    if (r) {
      setRole(r);
      localStorage.setItem("role", r);
    }
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
