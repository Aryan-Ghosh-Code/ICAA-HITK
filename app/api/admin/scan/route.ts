import { z } from "zod";
import { db, type UserDoc, type ClaimDoc, type ScanLogDoc } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { processScan, type ScanDeps } from "@/lib/scan";
import { json, requireJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  id: z.string(),
  slot: z.string(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return json({ error: "Unauthorized" }, 401);

  const ctErr = requireJson(req);
  if (ctErr) return ctErr;

  const raw = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return json({ status: "INVALID" }, 200);

  const { id, slot } = parsed.data;
  const d = await db();
  const users = d.collection<UserDoc>("users");
  const claims = d.collection<ClaimDoc>("meal_claims");
  const scanLog = d.collection<ScanLogDoc>("scan_log");

  const ignoreWindow = process.env.SCAN_IGNORE_WINDOW === "1";

  const deps: ScanDeps = {
    findUser: (uid) =>
      users.findOne({ _id: uid }, { projection: { name: 1, foodSlots: 1 } }),
    insertClaim: async (c) => {
      await claims.insertOne(c);
    },
    findClaim: (userId, targetSlot) =>
      claims.findOne({ userId, slot: targetSlot }),
    now: () => new Date(),
    ignoreWindow,
  };

  const result = await processScan(deps, {
    id,
    slot,
    volunteer: session.name,
  });

  // Log scan attempt
  const user =
    result.status !== "INVALID" && result.status !== "BAD_SLOT"
      ? await users.findOne({ _id: id as string }, { projection: { _id: 1 } })
      : null;

  // Log scan attempt
  const logEntry: Parameters<typeof scanLog.insertOne>[0] = {
    claimedAt: new Date(),
    volunteer: session.name,
    slot,
    status: result.status,
    userId: user ? String(user._id) : "",
    ...(result.status === "INVALID"
      ? { rawIdPrefix: String(id).slice(0, 4) }
      : {}),
  };
  await scanLog.insertOne(logEntry);

  return json(result);
}
