import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

if (!process.env.ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY env var must be set");
}
// Support both formats:
// - Legacy: 32+ char UTF-8 string (old deployments)
// - Preferred: base64-encoded 32-byte random key
const raw = process.env.ENCRYPTION_KEY;
let KEY: Buffer;
const fromBase64 = Buffer.from(raw, "base64");
if (fromBase64.length === 32) {
  KEY = fromBase64;
} else {
  // Fall back to UTF-8 for backward compatibility with existing encrypted data
  KEY = Buffer.from(raw, "utf8").subarray(0, 32);
  if (KEY.length < 32) {
    throw new Error("ENCRYPTION_KEY must be at least 32 characters");
  }
}

export function encryptKey(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), tag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decryptKey(ciphertext: string): string {
  const [ivHex, tagHex, encryptedHex] = ciphertext.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}
