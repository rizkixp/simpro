/**
 * Modul Keamanan & Kriptografi Aplikasi SIM SD Islam Smart School
 * Menggunakan Web Crypto API berstandar internasional (Salted SHA-256)
 * Kompatibel untuk runtime Browser (Client) dan Node.js (Server)
 */

// Helper: Convert ArrayBuffer to Hex String
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

// Helper: Get Crypto instance across environments
function getCrypto(): Crypto {
  if (typeof window !== "undefined" && window.crypto) {
    return window.crypto;
  }
  // Node.js fallback
  try {
    return (require("crypto") as any).webcrypto || (globalThis as any).crypto;
  } catch {
    return globalThis.crypto;
  }
}

/**
 * Mengenkripsi kata sandi menjadi hash aman dengan salt acak 16-byte
 * Format output: "s256:{saltHex}:{hashHex}"
 */
export async function hashPassword(password: string): Promise<string> {
  const cryptoInstance = getCrypto();
  if (!cryptoInstance || !cryptoInstance.subtle) {
    // Fallback if subtle crypto unavailable
    return "legacy:" + password;
  }

  // 1. Generate 16-byte cryptographically secure random salt
  const saltBytes = new Uint8Array(16);
  cryptoInstance.getRandomValues(saltBytes);
  const saltHex = bufferToHex(saltBytes.buffer as ArrayBuffer);

  // 2. Hash password + salt using SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(password + ":" + saltHex);
  const hashBuffer = await cryptoInstance.subtle.digest("SHA-256", data);
  const hashHex = bufferToHex(hashBuffer);

  return `s256:${saltHex}:${hashHex}`;
}

/**
 * Memverifikasi kata sandi yang diinput pengguna dengan hash tersimpan.
 * Mendukung auto-detection untuk hash modern (s256) maupun kata sandi plaintext warisan (legacy).
 */
export async function verifyPassword(
  inputPassword: string,
  storedHash?: string | null
): Promise<{ valid: boolean; needsUpgrade: boolean }> {
  if (!storedHash) {
    return { valid: false, needsUpgrade: false };
  }

  // Check if stored format is salted SHA-256
  if (storedHash.startsWith("s256:")) {
    const parts = storedHash.split(":");
    if (parts.length !== 3) {
      return { valid: false, needsUpgrade: false };
    }

    const saltHex = parts[1];
    const expectedHash = parts[2];

    const cryptoInstance = getCrypto();
    if (!cryptoInstance || !cryptoInstance.subtle) {
      return { valid: false, needsUpgrade: false };
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(inputPassword + ":" + saltHex);
    const hashBuffer = await cryptoInstance.subtle.digest("SHA-256", data);
    const computedHash = bufferToHex(hashBuffer);

    const match = computedHash.toLowerCase() === expectedHash.toLowerCase();
    return { valid: match, needsUpgrade: false };
  }

  // Legacy plaintext detection (e.g. "password123")
  const match = inputPassword === storedHash || storedHash === "legacy:" + inputPassword;
  return {
    valid: match,
    needsUpgrade: match, // Needs auto-upgrade to salted hash upon successful login
  };
}

/**
 * Menghasilkan token sesi acak aman berstandar kriptografi (24 byte / 48 karakter hex)
 */
export function generateSessionToken(): string {
  const cryptoInstance = getCrypto();
  const tokenBytes = new Uint8Array(24);
  if (cryptoInstance && cryptoInstance.getRandomValues) {
    cryptoInstance.getRandomValues(tokenBytes);
  } else {
    for (let i = 0; i < 24; i++) {
      tokenBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bufferToHex(tokenBytes.buffer as ArrayBuffer);
}

/**
 * Membersihkan input teks dari karakter bahaya tag script HTML
 */
export function sanitizeInput(str: string): string {
  if (!str) return "";
  return str
    .trim()
    .replace(/[<>]/g, "");
}
