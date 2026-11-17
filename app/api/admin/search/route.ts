import { type NextRequest } from "next/server";
import { db, type UserDoc, type ClaimDoc } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { json } from "@/lib/http";
import { parsePid } from "@/lib/ids";
import { CATEGORIES, PID_PREFIX } from "@/constants/2027/categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return json({ error: "Unauthorized" }, 401);

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return json({ error: "Query must be at least 2 characters" }, 400);
  }

  const d = await db();
  const users = d.collection<UserDoc>("users");
  const claims = d.collection<ClaimDoc>("meal_claims");

  const rx = new RegExp(esc(q), "i");
  const matchedUsers = await users
    .find({ $or: [{ name: rx }, { PIDs: rx }] })
    .limit(20)
    .toArray();

  const results = await Promise.all(
    matchedUsers.map(async (u) => {
      const userClaims = await claims.find({ userId: u._id }).toArray();
      const claimedSlots = userClaims.map((c) => c.slot);
      const roles = [
        ...new Set(
          u.PIDs.map((pid) => parsePid(pid, PID_PREFIX))
            .filter(Boolean)
            .map((p) => CATEGORIES[p!.cat].role),
        ),
      ].join("; ");

      return {
        id: u._id,
        name: u.name,
        primaryPid: u.PIDs[0] ?? "",
        roles,
        foodSlots: u.foodSlots,
        claimedSlots,
      };
    }),
  );

  return json(results);
}
