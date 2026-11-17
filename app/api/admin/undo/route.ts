import { z } from "zod";
import { db, type UserDoc, type ClaimDoc, type ScanLogDoc } from "@/lib/db";
import { requireSession, json, requireJson } from "@/lib/http";
import { ID_RE } from "@/lib/ids";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  key: z.string().min(1),
  slot: z.string().min(1),
});

export async function POST(req: Request) {
  const sessionOrRes = await requireSession("admin");
  if (sessionOrRes instanceof Response) return sessionOrRes;

  const ctErr = requireJson(req);
  if (ctErr) return ctErr;

  const raw = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return json({ error: "Invalid request body" }, 400);
  }

  const { key, slot } = parsed.data;
  const d = await db();
  const users = d.collection<UserDoc>("users");
  const claims = d.collection<ClaimDoc>("meal_claims");
  const scanLog = d.collection<ScanLogDoc>("scan_log");

  const user = await users.findOne(
    ID_RE.test(key) ? { _id: key } : { PIDs: key },
  );

  if (!user) {
    return json({ error: "User not found" }, 404);
  }

  const res = await claims.deleteOne({ userId: user._id, slot });
  if (res.deletedCount > 0) {
    await scanLog.insertOne({
      claimedAt: new Date(),
      volunteer: sessionOrRes.name,
      slot,
      status: "UNDONE",
      userId: user._id,
    });
  }

  return json({ ok: true, name: user.name });
}
