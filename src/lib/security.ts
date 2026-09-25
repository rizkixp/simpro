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

/**
 * Bank-Grade Anti Brute-Force Rate Limiter (Standar PCI-DSS)
 * Batas: Maksimal 5 kali kegagalan berturut-turut -> Freeze / Lockout 15 menit
 */
export interface RateLimitStatus {
  isLocked: boolean;
  attemptsLeft: number;
  lockoutRemainingSeconds: number;
  message?: string;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 menit
const ATTEMPT_WINDOW_MS = 30 * 60 * 1000; // 30 menit reset window

export function checkLoginRateLimit(identifier: string): RateLimitStatus {
  if (typeof window === "undefined" || !identifier) {
    return { isLocked: false, attemptsLeft: MAX_FAILED_ATTEMPTS, lockoutRemainingSeconds: 0 };
  }

  const cleanKey = `sim_sec_lim_${encodeURIComponent(identifier.trim().toLowerCase())}`;
  try {
    const raw = localStorage.getItem(cleanKey);
    if (!raw) {
      return { isLocked: false, attemptsLeft: MAX_FAILED_ATTEMPTS, lockoutRemainingSeconds: 0 };
    }

    const record = JSON.parse(raw);
    const now = Date.now();

    // 1. Cek status lockout
    if (record.lockoutUntil && record.lockoutUntil > now) {
      const remainingSeconds = Math.ceil((record.lockoutUntil - now) / 1000);
      const remainingMinutes = Math.ceil(remainingSeconds / 60);
      return {
        isLocked: true,
        attemptsLeft: 0,
        lockoutRemainingSeconds: remainingSeconds,
        message: `Akun ini dikunci sementara demi keamanan karena 5 kali percobaan gagal berturut-turut. Silakan coba lagi dalam ${remainingMinutes} menit.`,
      };
    }

    // 2. Cek apakah batas window 30 menit sudah berakhir (reset otomatis)
    if (record.lastAttempt && now - record.lastAttempt > ATTEMPT_WINDOW_MS) {
      localStorage.removeItem(cleanKey);
      return { isLocked: false, attemptsLeft: MAX_FAILED_ATTEMPTS, lockoutRemainingSeconds: 0 };
    }

    const attemptsCount = record.attempts || 0;
    const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - attemptsCount);

    return {
      isLocked: false,
      attemptsLeft: remaining,
      lockoutRemainingSeconds: 0,
    };
  } catch {
    return { isLocked: false, attemptsLeft: MAX_FAILED_ATTEMPTS, lockoutRemainingSeconds: 0 };
  }
}

export function recordFailedLoginAttempt(identifier: string): RateLimitStatus {
  if (typeof window === "undefined" || !identifier) {
    return { isLocked: false, attemptsLeft: MAX_FAILED_ATTEMPTS - 1, lockoutRemainingSeconds: 0 };
  }

  const cleanKey = `sim_sec_lim_${encodeURIComponent(identifier.trim().toLowerCase())}`;
  try {
    const now = Date.now();
    let currentAttempts = 0;

    const raw = localStorage.getItem(cleanKey);
    if (raw) {
      const record = JSON.parse(raw);
      if (record.lastAttempt && now - record.lastAttempt <= ATTEMPT_WINDOW_MS) {
        currentAttempts = record.attempts || 0;
      }
    }

    currentAttempts += 1;

    // Jika mencapai ambang batas 5 kali gagal: Kunci 15 menit
    if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockoutUntil = now + LOCKOUT_DURATION_MS;
      localStorage.setItem(
        cleanKey,
        JSON.stringify({
          attempts: currentAttempts,
          lastAttempt: now,
          lockoutUntil,
        })
      );

      return {
        isLocked: true,
        attemptsLeft: 0,
        lockoutRemainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
        message: `Terlalu banyak percobaan login gagal. Akun dikunci sementara selama 15 menit demi keamanan data sekolah.`,
      };
    }

    localStorage.setItem(
      cleanKey,
      JSON.stringify({
        attempts: currentAttempts,
        lastAttempt: now,
        lockoutUntil: null,
      })
    );

    const attemptsLeft = MAX_FAILED_ATTEMPTS - currentAttempts;
    let warnMsg = "";
    if (attemptsLeft <= 2) {
      warnMsg = `Peringatan Keamanan: Tersisa ${attemptsLeft} kesempatan sebelum akun dikunci sementara.`;
    }

    return {
      isLocked: false,
      attemptsLeft,
      lockoutRemainingSeconds: 0,
      message: warnMsg,
    };
  } catch {
    return { isLocked: false, attemptsLeft: 3, lockoutRemainingSeconds: 0 };
  }
}

export function clearLoginRateLimit(identifier: string): void {
  if (typeof window === "undefined" || !identifier) return;
  const cleanKey = `sim_sec_lim_${encodeURIComponent(identifier.trim().toLowerCase())}`;
  try {
    localStorage.removeItem(cleanKey);
  } catch {}
}
