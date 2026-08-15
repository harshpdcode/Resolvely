/**
 * Server-only password hashing helpers using bcryptjs.
 * bcryptjs is a pure-JS bcrypt implementation — no native compilation required.
 * Cost factor 12 is the recommended minimum for 2025 hardware.
 */
import bcrypt from "bcryptjs";

const COST_FACTOR = 12;

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, COST_FACTOR);
}

export async function verifyPassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(plaintext, hash);
  } catch {
    return false;
  }
}
