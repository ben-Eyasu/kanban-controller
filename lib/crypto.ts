const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY environment variable is required");
}

const key = Buffer.from(ENCRYPTION_KEY, "hex");

export function encrypt(plaintext: string): string {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  return Buffer.from(iv).toString("hex") + ":" + Buffer.from(plaintext).toString("hex");
}

export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(":");
  return Buffer.from(parts[1], "hex").toString("utf8");
}
