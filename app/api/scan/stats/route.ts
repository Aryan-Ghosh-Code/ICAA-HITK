import { type NextRequest } from "next/server";
import { db, type UserDoc, type ClaimDoc } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { json } from "@/lib/http";
import { MEAL_SLOTS } from "@/constants/2027/mealSlots";
import { getActiveMealSlot } from "@/lib/flags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Uses volunteer session (icaa_vol cookie), NOT admin session
  const session = await getSession();
  if (!session) return json({ error: "Unauthorized" }, 401);

  const activeSlot = await getActiveMealSlot();
  const querySlot = req.nextUrl.searchParams.get("slot");
  const slot = querySlot && MEAL_SLOTS.some((s) => s.id === querySlot)
    ? querySlot
    : activeSlot;

  const d = await db();
  const users = d.collection<UserDoc>("users");
  const claims = d.collection<ClaimDoc>("meal_claims");

  const eligible = await users.countDocuments({ foodSlots: slot });
  const claimed = await claims.countDocuments({ slot });
  const remaining = Math.max(0, eligible - claimed);

  return json({ slot, activeSlot, eligible, claimed, remaining });
}
