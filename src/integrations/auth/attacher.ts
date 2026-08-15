/**
 * Client middleware that attaches the JWT Bearer token to every server fn call.
 * Replaces the old attachSupabaseAuth middleware.
 * Registered as a global functionMiddleware in src/start.ts.
 */
import { createMiddleware } from "@tanstack/react-start";
import { getToken } from "@/integrations/auth/client";

export const attachAuthToken = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const token = getToken();
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }
);
