import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SLOTS = ["D1_LUNCH", "D2_LUNCH", "D2_DINNER", "D3_LUNCH"] as const;

const SLOT_LABELS: Record<string, string> = {
  D1_LUNCH: "Day 1 Lunch",
  D2_LUNCH: "Day 2 Lunch",
  D2_DINNER: "Day 2 Banquet Dinner",
  D3_LUNCH: "Day 3 Lunch",
};

export async function GET(req: NextRequest) {
  const isAuth = await getAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const slotParam = url.searchParams.get("slot"); // optional filter

  const db = await getDb();
  const users = await db.collection("users").find().toArray();
  const allClaims = await db.collection("meal_claims").find().sort({ claimedAt: 1 }).toArray();

  const userMap = new Map<string, { name: string; primaryPid: string; foodSlots: string[] }>();
  for (const u of users) {
    userMap.set(String(u._id), {
      name: u.name,
      primaryPid: u.PIDs?.[0] || "",
      foodSlots: u.foodSlots ?? [],
    });
  }

  const claimMap = new Map<string, { claimedAt: Date | string; claimedBy: string }>();
  for (const c of allClaims) {
    claimMap.set(`${c.userId}__${c.slot}`, {
      claimedAt: c.claimedAt,
      claimedBy: c.claimedBy || c.volunteer || "",
    });
  }

  const targetSlots = slotParam && SLOTS.includes(slotParam as typeof SLOTS[number])
    ? [slotParam]
    : [...SLOTS];

  // Build slot-wise roster CSV
  const sections: string[] = [];

  for (const slot of targetSlots) {
    const label = SLOT_LABELS[slot] || slot;
    const eligible = users.filter((u) => (u.foodSlots ?? []).includes(slot));

    sections.push(`# ${label} (${slot})`);
    sections.push(`name,userId,primaryPid,served,claimedAt,claimedBy`);

    for (const u of eligible.sort((a, b) => a.name.localeCompare(b.name))) {
      const claim = claimMap.get(`${u._id}__${slot}`);
      const claimedAt = claim?.claimedAt instanceof Date
        ? claim.claimedAt.toISOString()
        : claim?.claimedAt
          ? new Date(claim.claimedAt as string).toISOString()
          : "";
      sections.push([
        `"${(u.name || "").replace(/"/g, '""')}"`,
        String(u._id),
        u.PIDs?.[0] || "",
        claim ? "YES" : "NO",
        claimedAt,
        `"${(claim?.claimedBy || "").replace(/"/g, '""')}"`,
      ].join(","));
    }

    sections.push(""); // blank line between slots
  }

  const csv = sections.join("\n");
  const slotSuffix = slotParam ? `_${slotParam}` : "_all_slots";

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="icaa2027_meal_roster${slotSuffix}_${Date.now()}.csv"`,
    },
  });
}
