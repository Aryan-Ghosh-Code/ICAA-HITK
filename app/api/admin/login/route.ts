import { z } from "zod";
import { db, type VolunteerDoc } from "@/lib/db";
import { verifyPassword } from "@/lib/pin";
import { createSession } from "@/lib/auth";
import { json, requireJson } from "@/lib/http";
import { hit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string(),
  password: z.string().optional(),
  pin: z.string().optional(),
});

const DUMMY = "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012";

export async function POST(req: Request) {
  const ctErr = requireJson(req);
  if (ctErr) return ctErr;

  const raw = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success)
    return json({ ok: false, error: "Invalid request body" }, 400);

  const name = parsed.data.name.trim().toLowerCase();
  const password = parsed.data.password || parsed.data.pin || "";

  if (!password) {
    return json({ ok: false, error: "Password is required" }, 400);
  }

  const d = await db();

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rateLimitKey = `login:${ip}:${name}`;
  const rl = await hit(d, rateLimitKey, { max: 5, windowMs: 10 * 60 * 1000 });

  if (!rl.allowed) {
    return json({ ok: false, error: "Too many attempts" }, 429);
  }

  const vol = name
    ? await d.collection<VolunteerDoc>("volunteers").findOne({ name })
    : null;
  const hash = vol?.passwordHash || DUMMY;
  const passwordOk = verifyPassword(password, hash);

  if (!vol || !vol.active || !passwordOk) {
    await hit(d, rateLimitKey, { max: 5, windowMs: 10 * 60 * 1000 });
    await new Promise((r) => setTimeout(r, 600));
    return json(
      { ok: false, error: "Invalid volunteer name or password" },
      401,
    );
  }

  await d.collection("login_attempts").deleteOne({ key: rateLimitKey });
  await createSession({ id: vol._id, name: vol.name, role: vol.role });
  return json({ ok: true });
}
