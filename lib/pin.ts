import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/** Hashes a volunteer password using bcrypt. */
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

/** Verifies a plaintext password against a stored bcrypt hash. */
export function verifyPassword(password: string, stored: string): boolean {
  try {
    return bcrypt.compareSync(password, stored);
  } catch {
    return false;
  }
}

// Backwards-compatible aliases
export const hashPin = hashPassword;
export const verifyPin = verifyPassword;