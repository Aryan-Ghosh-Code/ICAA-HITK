import { randomBytes } from "node:crypto";
import {
  CATEGORIES,
  PID_PREFIX,
  type CategoryCode,
} from "../constants/2027/categories";

/** _id of a user = the secret token inside the printed QR (32 random hex chars). */
export const ID_RE = /^[a-f0-9]{32}$/;

/** Returns a PID regex for the given prefix (defaults to PID_PREFIX e.g. ICAA27). */
export function pidShape(prefix: string = PID_PREFIX): RegExp {
  return new RegExp(`^${prefix}_([A-Z]{2,4})_(\\d{3})$`);
}

export function parsePid(
  pid: string,
  prefix: string = PID_PREFIX,
): { cat: CategoryCode; num: string } | null {
  const m = pidShape(prefix).exec(pid);
  if (!m || !(m[1] in CATEGORIES)) return null;
  return { cat: m[1] as CategoryCode, num: m[2] };
}

export function newId(): string {
  return randomBytes(16).toString("hex");
}
