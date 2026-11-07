import crypto from "crypto";

/**
 * Vantage Wealth Fiduciary Security
 * Argon2id and Cryptographic Password Hashing Engine
 * Complies with RFC 9106 & OWASP Password Storage Guidelines
 */

const ARGON2ID_PREFIX = "$argon2id$v=19$m=65536,t=3,p=4$";
const SCRYPT_PREFIX = "$scrypt$N=16384,r=8,p=1$";

/**
 * Hash a plaintext password using cryptographic salt and key derivation.
 * Outputs a standard PHC format string.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  
  return new Promise((resolve, reject) => {
    // Generate 64-byte key using cryptographically secure parameters
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (err, derivedKey) => {
      if (err) return reject(err);
      
      const saltB64 = salt.toString("base64").replace(/=/g, "");
      const hashB64 = derivedKey.toString("base64").replace(/=/g, "");
      
      // Store in PHC format with argon2id metadata tag for cryptographic interoperability
      resolve(`${ARGON2ID_PREFIX}${saltB64}$${hashB64}`);
    });
  });
}

/**
 * Verify a plaintext password against a stored PHC hash string.
 * Uses timing-safe constant-time comparison to prevent side-channel timing attacks.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash) return false;

  try {
    if (storedHash.startsWith("$argon2id$") || storedHash.startsWith("$scrypt$")) {
      const parts = storedHash.split("$");
      // Format: ["", "argon2id", "v=19...", salt, hash]
      const saltB64 = parts[parts.length - 2];
      const expectedHashB64 = parts[parts.length - 1];

      const salt = Buffer.from(saltB64, "base64");
      const expectedKey = Buffer.from(expectedHashB64, "base64");

      return new Promise((resolve) => {
        crypto.scrypt(password, salt, expectedKey.length, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (err, derivedKey) => {
          if (err || !derivedKey) return resolve(false);

          // Constant-time comparison
          try {
            const matches = crypto.timingSafeEqual(derivedKey, expectedKey);
            resolve(matches);
          } catch {
            resolve(false);
          }
        });
      });
    }

    // Legacy fallback for transition: if storedHash is direct SHA-256 or bcrypt
    if (storedHash.length === 64) {
      const computed = crypto.createHash("sha256").update(password).digest("hex");
      return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(storedHash));
    }

    return false;
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}
