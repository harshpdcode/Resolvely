/**
 * Server middleware replacing requireSupabaseAuth.
 * Reads Bearer token from Authorization header, verifies JWT,
 * attaches { userId, role } to request context.
 *
 * Falls back to mock if JWT_SECRET or DATABASE_URL is not configured
 * (offline/Lovable-preview mode).
 *
 * Also provides a simple in-memory rate limiter for auth endpoints.
 */
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { verifyToken, type TokenPayload } from "./jwt.server";

// ─── Rate limiter ─────────────────────────────────────────────────────────

type RateLimitEntry = { count: number; resetAt: number };
const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(key: string): void {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const waitSec = Math.ceil((entry.resetAt - now) / 1000);
    throw new Error(
      `Too many attempts. Please try again in ${waitSec} seconds.`
    );
  }

  entry.count++;
}

export function clearRateLimit(key: string): void {
  rateLimitMap.delete(key);
}

// ─── Mock context (offline mode) ──────────────────────────────────────────

function isMockMode(): boolean {
  return !process.env.DATABASE_URL || !process.env.JWT_SECRET;
}

async function getMockContext(): Promise<TokenPayload & { isMock: boolean }> {
  const { mockSupabase } = await import("@/integrations/supabase/mock-client");
  const { data } = await mockSupabase.auth.getUser();
  const userId = data?.user?.id ?? "mock-admin-id";
  return { userId, role: "admin", isMock: true };
}

// ─── Auth middleware ──────────────────────────────────────────────────────

export type AuthContext = TokenPayload & { isMock?: boolean };

export const requireAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    if (isMockMode()) {
      const ctx = await getMockContext();
      return next({ context: ctx });
    }

    const request = getRequest();
    if (!request?.headers) {
      throw new Error("Unauthorized: No request headers available");
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Unauthorized: Bearer token required");
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      throw new Error("Unauthorized: Empty token");
    }

    const payload = await verifyToken(token);

    return next({ context: { ...payload, isMock: false } });
  }
);
