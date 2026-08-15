/**
 * Auth server functions — register, login, getProfile, getGoogleAuthUrl, handleGoogleCallback.
 * These run entirely server-side; the client never touches the DB or hashes.
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireAuth, checkRateLimit, clearRateLimit } from "@/integrations/auth/middleware";
import { registerSchema, loginSchema } from "@/lib/validation";
import { sendEmail, welcomeEmailHtml } from "@/lib/email.server";

// ─── Mock-mode helpers ────────────────────────────────────────────────────

function isMockMode() {
  return !process.env.DATABASE_URL || !process.env.JWT_SECRET;
}

// ─── Register ─────────────────────────────────────────────────────────────

export const register = createServerFn({ method: "POST" })
  .validator((data: unknown) => registerSchema.parse(data))
  .handler(async ({ data }): Promise<{ token: string; role: "admin" | "user"; userId: string }> => {
    if (isMockMode()) {
      const { mockSupabase } = await import("@/integrations/supabase/mock-client");
      const { signToken } = await import("@/integrations/auth/jwt.server");
      const result = await mockSupabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { full_name: data.fullName } },
      });
      if (result.error) throw new Error(result.error.message);
      const userId = result.data.user!.id;
      // Only admin@example.com is admin. All other registered users are standard users.
      const role: "admin" | "user" = data.email.toLowerCase().trim() === "admin@example.com" ? "admin" : "user";
      const token = await signToken({ userId, role });
      return { token, role, userId };
    }

    const request = getRequest();
    const ip = request?.headers.get("x-forwarded-for") ?? "unknown";
    checkRateLimit(`register:${ip}`);

    const { prisma } = await import("@/integrations/db/client.server");
    const { hashPassword } = await import("@/integrations/auth/password.server");
    const { signToken } = await import("@/integrations/auth/jwt.server");

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error("An account with this email already exists.");

    const passwordHash = await hashPassword(data.password);

    // First user ever → admin
    const adminCount = await prisma.userRole.count({ where: { role: "admin" } });
    const role: "admin" | "user" = adminCount === 0 ? "admin" : "user";

    const user = await prisma.$transaction(async (tx: any) => {
      const u = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          fullName: data.fullName,
          roles: { create: { role } },
        },
      });
      return u;
    });

    clearRateLimit(`register:${ip}`);

    // Welcome email (non-blocking)
    const appUrl = process.env.APP_URL ?? "http://localhost:8080";
    sendEmail({
      to: user.email,
      subject: "Welcome to Resolvely!",
      html: welcomeEmailHtml({ fullName: user.fullName ?? user.email, appUrl }),
    }).catch(console.error);

    const token = await signToken({ userId: user.id, role });
    return { token, role, userId: user.id };
  });

// ─── Login ────────────────────────────────────────────────────────────────

export const login = createServerFn({ method: "POST" })
  .validator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }): Promise<{ token: string; role: "admin" | "user"; userId: string; fullName: string | null }> => {
    if (isMockMode()) {
      const { mockSupabase } = await import("@/integrations/supabase/mock-client");
      const { signToken } = await import("@/integrations/auth/jwt.server");
      const result = await mockSupabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (result.error) throw new Error(result.error.message);
      const userId = result.data.user!.id;
      // Only admin@example.com is admin. All other users are standard users.
      const role: "admin" | "user" = data.email.toLowerCase().trim() === "admin@example.com" ? "admin" : "user";
      const token = await signToken({ userId, role });
      return { token, role, userId, fullName: result.data.user?.user_metadata?.full_name ?? null };
    }

    const request = getRequest();
    const ip = request?.headers.get("x-forwarded-for") ?? "unknown";
    checkRateLimit(`login:${ip}`);

    const { prisma } = await import("@/integrations/db/client.server");
    const { verifyPassword } = await import("@/integrations/auth/password.server");
    const { signToken } = await import("@/integrations/auth/jwt.server");

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { roles: true },
    });

    // Constant-time comparison to prevent user enumeration
    const dummyHash = "$2b$12$saltsaltsaltsaltsalts.dummyhashpaddingtomakeitmatch000000000";
    const passwordOk = user
      ? await verifyPassword(data.password, user.passwordHash)
      : await verifyPassword("dummy", dummyHash).catch(() => false);

    if (!user || !passwordOk) {
      throw new Error("Invalid email or password.");
    }

    clearRateLimit(`login:${ip}`);

    const roleRecord = user.roles[0];
    const role: "admin" | "user" = roleRecord?.role === "admin" ? "admin" : "user";
    const token = await signToken({ userId: user.id, role });

    return { token, role, userId: user.id, fullName: user.fullName };
  });

// ─── Get Profile ──────────────────────────────────────────────────────────

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<{ email: string; fullName: string | null; role: "admin" | "user" }> => {
    if (context.isMock) {
      const { mockSupabase } = await import("@/integrations/supabase/mock-client");
      const { data: profile } = await mockSupabase.from("profiles").select("*").eq("id", context.userId).maybeSingle();
      const role = context.role;
      return {
        email: profile?.email ?? (role === "admin" ? "admin@example.com" : "customer@example.com"),
        fullName: profile?.full_name ?? (role === "admin" ? "System Admin" : "Customer User"),
        role,
      };
    }

    const { prisma } = await import("@/integrations/db/client.server");
    const user = await prisma.user.findUnique({
      where: { id: context.userId },
      include: { roles: true },
    });
    if (!user) throw new Error("User not found");

    const role = user.roles[0]?.role === "admin" ? "admin" : "user";
    return { email: user.email, fullName: user.fullName, role };
  });

// ─── Google OAuth ─────────────────────────────────────────────────────────

const GOOGLE_AUTH_REDIRECT_URI = `${process.env.APP_URL ?? "http://localhost:8080"}/auth/callback/google`;
const GOOGLE_SCOPES = "openid email profile";

export const getGoogleAuthUrl = createServerFn({ method: "GET" })
  .handler(async (): Promise<{ url: string }> => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new Error("Google OAuth is not configured (GOOGLE_CLIENT_ID missing)");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: GOOGLE_AUTH_REDIRECT_URI,
      response_type: "code",
      scope: GOOGLE_SCOPES,
      access_type: "offline",
      prompt: "consent",
    });

    return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` };
  });

export const handleGoogleCallback = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ code: z.string() }).parse(data))
  .handler(async ({ data }): Promise<{ token: string; role: "admin" | "user"; userId: string; fullName: string | null }> => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error("Google OAuth not configured");

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: GOOGLE_AUTH_REDIRECT_URI,
        grant_type: "authorization_code",
        code: data.code,
      }),
    });

    if (!tokenRes.ok) throw new Error("Failed to exchange Google auth code");
    const tokens = await tokenRes.json();

    // Get user info from Google
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!userInfoRes.ok) throw new Error("Failed to fetch Google user info");
    const googleUser = await userInfoRes.json();

    const { prisma } = await import("@/integrations/db/client.server");
    const { signToken } = await import("@/integrations/auth/jwt.server");
    const { hashPassword } = await import("@/integrations/auth/password.server");

    // Upsert user
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
      include: { roles: true },
    });

    if (!user) {
      const adminCount = await prisma.userRole.count({ where: { role: "admin" } });
      const role: "admin" | "user" = adminCount === 0 ? "admin" : "user";

      // Random password for OAuth users (they can't use password login)
      const passwordHash = await hashPassword(crypto.randomUUID());

      user = await prisma.$transaction(async (tx: any) => {
        const u = await tx.user.create({
          data: {
            email: googleUser.email,
            passwordHash,
            fullName: googleUser.name ?? googleUser.email,
            roles: { create: { role } },
          },
          include: { roles: true },
        });
        return u;
      });
    }

    const role = user.roles[0]?.role === "admin" ? "admin" : "user";
    const token = await signToken({ userId: user.id, role });
    return { token, role, userId: user.id, fullName: user.fullName };
  });
