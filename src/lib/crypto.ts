import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

if (!process.env.ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY env var must be set");
}
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, "base64");
if (KEY.length !== 32) {
  throw new Error("ENCRYPTION_KEY must decode to exactly 32 bytes. Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"");
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
