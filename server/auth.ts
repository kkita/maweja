import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";

const SALT_ROUNDS = 12;

/**
 * Hash a plaintext password.
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * Compare a plaintext attempt against a stored value.
 *
 * Migration strategy: existing accounts may still hold a plaintext password.
 * We try bcrypt first; if the stored string does not look like a bcrypt hash
 * (i.e. it doesn't start with "$2") we fall back to a direct comparison so
 * that old accounts still work.  The caller should rehash & save when this
 * fallback succeeds so the account is transparently migrated.
 *
 * Returns { ok: boolean, needsRehash: boolean }
 */
export async function verifyPassword(
  plain: string,
  stored: string,
): Promise<{ ok: boolean; needsRehash: boolean }> {
  if (stored.startsWith("$2")) {
    // Already a bcrypt hash
    const ok = await bcrypt.compare(plain, stored);
    return { ok, needsRehash: false };
  }
  // Plaintext fallback (legacy migration)
  const ok = plain === stored;
  return { ok, needsRehash: ok };
}

// ── Rate limiters ─────────────────────────────────────────────────────────────

/** Strict limiter for login — 10 attempts / 15 min per IP */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Trop de tentatives de connexion. Réessayez dans 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Forgot-password — 5 requests / 15 min per IP */
export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Trop de demandes. Réessayez dans 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Upload endpoints — 30 uploads / 10 min per IP */
export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: { message: "Trop d'envois de fichiers. Réessayez plus tard." },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Wallet topup — 20 requests / 10 min per IP */
export const walletLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { message: "Trop de recharges. Réessayez plus tard." },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Registration — 10 / 15 min per IP */
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Trop d'inscriptions depuis cette adresse. Réessayez plus tard." },
  standardHeaders: true,
  legacyHeaders: false,
});
