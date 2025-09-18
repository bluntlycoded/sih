// Lightweight base64url decoder + JWT payload parser
export function parseJwt<T = any>(token: string): T | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export type JwtClaims = {
  sub?: string;
  role?: "ADMIN" | "UNIVERSITY" | "STUDENT";
  iat?: number;
  exp?: number;
};

export function getRoleFromAccessToken(token: string): JwtClaims["role"] | null {
  const claims = parseJwt<JwtClaims>(token);
  return claims?.role ?? null;
}
