import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "icaa_vol";
const ADMIN_COOKIE = "icaa_admin";
const key = () => new TextEncoder().encode(process.env.AUTH_SECRET);

export interface Session {
  sub: string;
  name: string;
  role: "volunteer" | "admin";
}

export async function createSession(v: {
  id: string;
  name: string;
  role: Session["role"];
}) {
  const jwt = await new SignJWT({ name: v.name, role: v.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(v.id)
    .setExpirationTime("12h")
    .sign(key());

  (await cookies()).set(COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearSession() {
  (await cookies()).set(COOKIE, "", { maxAge: 0, path: "/" });
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function createAdminSession() {
  const jwt = await new SignJWT({ role: "admin", name: "Administrator" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("admin")
    .setExpirationTime("24h")
    .sign(key());

  (await cookies()).set(ADMIN_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export async function clearAdminSession() {
  (await cookies()).set(ADMIN_COOKIE, "", { maxAge: 0, path: "/" });
}

export async function getAdminSession(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload.role === "admin";
  } catch {
    return false;
  }
}
