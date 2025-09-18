import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { getRoleFromAccessToken, isTokenExpired } from "../api/jwt";

type Role = "ADMIN" | "UNIVERSITY" | "STUDENT";

type Props = {
  children: React.ReactNode;
  allow?: Role[];
};

export const Protected: React.FC<Props> = ({ children, allow }) => {
  const { accessToken } = useAuth();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  // check expiry
  if (isTokenExpired(accessToken)) {
    console.warn("⚠️ Token expired, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // get role from JWT
  const roleFromJwt = getRoleFromAccessToken(accessToken);

  if (allow && roleFromJwt && !allow.includes(roleFromJwt)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
