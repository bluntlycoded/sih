import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";

type Props = {
  children: React.ReactNode;
  allow?: Array<"ADMIN" | "UNIVERSITY" | "STUDENT">;
};

export const Protected: React.FC<Props> = ({ children, allow }) => {
  const { accessToken, role } = useAuth();

  if (!accessToken) return <Navigate to="/login" replace />;

  if (allow && role && !allow.includes(role)) return <Navigate to="/" replace />;

  return <>{children}</>;
};
