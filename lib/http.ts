import { NextResponse } from "next/server";
import { getSession, type Session } from "./auth";

/** Sends JSON with Cache-Control: no-store. */
export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/** Returns 415 if the request Content-Type is not application/json. */
export function requireJson(req: Request): Response | null {
  const ct = req.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    return new Response("Content-Type must be application/json", {
      status: 415,
    });
  }
  return null;
}

/** Returns the session or a 401/403 Response (never null on success). */
export async function requireSession(
  role?: "volunteer" | "admin",
): Promise<Session | Response> {
  const session = await getSession();
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
  if (role && session.role !== role) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
  return session;
}
