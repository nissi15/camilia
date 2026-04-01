import crypto from "crypto";

const SECRET = process.env.NEXTAUTH_SECRET || process.env.TELEGRAM_BOT_TOKEN || "fallback-secret";
const TOKEN_EXPIRY_SECONDS = 30 * 86400; // 30 days

/**
 * Create a signed session token for a Telegram-linked user.
 * Token format: base64url(userId:telegramId:expiresAt).signature
 */
export function createSessionToken(userId: string, telegramId: number): string {
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS;
  const payload = `${userId}:${telegramId}:${expiresAt}`;
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${signature}`;
}

/**
 * Verify a session token and return the parsed payload.
 * Returns null if the token is invalid or expired.
 */
export function verifySessionToken(
  token: string
): { userId: string; telegramId: number } | null {
  try {
    const dotIndex = token.indexOf(".");
    if (dotIndex === -1) return null;

    const payloadB64 = token.slice(0, dotIndex);
    const signature = token.slice(dotIndex + 1);

    const payload = Buffer.from(payloadB64, "base64url").toString();
    const expectedSig = crypto
      .createHmac("sha256", SECRET)
      .update(payload)
      .digest("base64url");

    // Timing-safe comparison
    if (
      signature.length !== expectedSig.length ||
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSig)
      )
    ) {
      return null;
    }

    const parts = payload.split(":");
    if (parts.length !== 3) return null;

    const [userId, telegramIdStr, expiresAtStr] = parts;
    const expiresAt = parseInt(expiresAtStr);

    if (Math.floor(Date.now() / 1000) > expiresAt) return null;

    return { userId, telegramId: parseInt(telegramIdStr) };
  } catch {
    return null;
  }
}
