// ---------------- JWT Helpers ----------------

// Base64URL decode → string
function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
  return atob(padded);
}

// Parse JWT payload safely
export function parseJwt<T = any>(token: string): T | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const json = decodeURIComponent(
      base64UrlDecode(payload)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(json) as T;
  } catch (err) {
    console.error("❌ Failed to parse JWT:", err);
    return null;
  }
}

// Common claims
export type JwtClaims = {
  sub?: string;
  role?: "ADMIN" | "UNIVERSITY" | "STUDENT";
  iat?: number;
  exp?: number;
};

// Extract role
export function getRoleFromAccessToken(token: string): JwtClaims["role"] | null {
  const claims = parseJwt<JwtClaims>(token);
  return claims?.role ?? null;
}

// Check expiration
export function isTokenExpired(token: string): boolean {
  const claims = parseJwt<JwtClaims>(token);
  if (!claims?.exp) return true; // no expiry → treat as expired
  return Date.now() >= claims.exp * 1000;
}
