const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY environment variable is required");
}

// Derive a 256-bit key from the hex string using SHA-256
async function getKey(): Promise<CryptoKey> {
  const keyData = Uint8Array.from(
    ENCRYPTION_KEY!.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
  const hash = await crypto.subtle.digest("SHA-256", keyData);
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const ivHex = Array.from(iv).map((b) => b.toString(16).padStart(2, "0")).join("");
  const ctHex = Array.from(new Uint8Array(ciphertext))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${ivHex}:${ctHex}`;
}

export async function decrypt(ciphertext: string): Promise<string> {
  const key = await getKey();
  const [ivHex, ctHex] = ciphertext.split(":");
  const iv = Uint8Array.from(ivHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
  const ct = Uint8Array.from(ctHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(plaintext);
}
