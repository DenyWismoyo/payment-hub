import { customAlphabet } from "nanoid";

// Alphabet tanpa karakter ambigu (0/O, 1/I/L)
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const generateCode = customAlphabet(ALPHABET, 6);

/**
 * Generate kode akses unik format: PAY-XXXXXX
 */
export function generateAccessCode(): string {
  return `PAY-${generateCode()}`;
}

/**
 * Validasi format kode akses
 */
export function isValidAccessCodeFormat(code: string): boolean {
  return /^PAY-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/.test(code);
}

/**
 * Normalisasi input kode akses (uppercase, trim, tambah prefix jika perlu)
 */
export function normalizeAccessCode(input: string): string {
  let code = input.trim().toUpperCase();

  // Jika user hanya ketik 6 karakter tanpa prefix
  if (code.length === 6 && !code.startsWith("PAY-")) {
    code = `PAY-${code}`;
  }

  return code;
}
