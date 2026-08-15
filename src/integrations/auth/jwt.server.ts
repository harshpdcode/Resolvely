/**
 * Server-only JWT helpers using jose (pure JS, no native deps).
 * Tokens are HS256, signed with JWT_SECRET env var.
 */
import { SignJWT, jwtVerify } from "jose";

export type TokenPayload = {
  userId: string;
  role: "admin" | "user";
};

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "[Auth] JWT_SECRET is missing or too short (min 16 chars). Set it in .env."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: TokenPayload): Promise<string> {
  const expiresIn = process.env.JWT_EXPIRES_IN ?? "7d";
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.userId !== "string" ||
      (payload.role !== "admin" && payload.role !== "user")
    ) {
      throw new Error("Invalid token payload");
    }
    return { userId: payload.userId, role: payload.role };
  } catch (e) {
    throw new Error(
      `Unauthorized: ${e instanceof Error ? e.message : "Invalid token"}`
    );
  }
}
