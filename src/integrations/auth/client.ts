/**
 * Client-side auth helpers.
 * These run in the browser - no crypto, no argon2, no jose.
 *
 * Token lifecycle:
 *   - Stored in localStorage as "resolvely_token"
 *   - Attached to every server fn call via the middleware in start.ts
 *
 * Session decoding:
 *   - JWT payload is base64url-encoded — we decode it client-side
 *     without signature verification (verification happens server-side).
 */

const TOKEN_KEY = "resolvely_token";

export type ClientSession = {
  userId: string;
  role: "admin" | "user";
  exp: number;
};

export function saveToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

/** Decode JWT payload without verifying signature (verification is server-side) */
export function getSession(): ClientSession | null {
  const token = getToken();
  if (!token) return null;
  try {
    // Handle mock token format in fallback mode
    if (token.startsWith("mock-jwt-token-")) {
      const id = token.replace("mock-jwt-token-", "") || "mock-admin-id";
      return {
        userId: id,
        role: "admin",
        exp: Math.floor(Date.now() / 1000) + 86400 * 7,
      };
    }

    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      if (payload.userId && payload.role) {
        if (payload.exp && Date.now() / 1000 > payload.exp) {
          clearToken();
          return null;
        }
        return {
          userId: payload.userId,
          role: payload.role,
          exp: payload.exp ?? 0,
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

export function isAdmin(): boolean {
  return getSession()?.role === "admin";
}
