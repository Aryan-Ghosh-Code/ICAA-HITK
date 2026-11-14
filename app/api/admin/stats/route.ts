import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/pin";
import { parsePid } from "@/lib/ids";
import { CATEGORIES } from "@/constants/2027/categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const isAuth = await getAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();

  // 1. Participant count
  const allUsers = await db.collection("users").find({}).toArray();
  const totalUsers = allUsers.length;

  // 2. Headcount per category (derived from primary PID prefix/category)
  const categoryCounts: Record<string, number> = {};
  for (const u of allUsers) {
    const primaryPid = u.PIDs?.[0];
    const parsed = primaryPid ? parsePid(primaryPid) : null;
    const cat = parsed?.cat && CATEGORIES[parsed.cat] ? parsed.cat : "OTHER";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  // 3. Claims per slot (Collection is 'meal_claims')
  const slotCountsRaw = await db
    .collection("meal_claims")
    .aggregate([{ $group: { _id: "$slot", count: { $sum: 1 } } }])
    .toArray();
  const slotCounts: Record<string, number> = {};
  for (const s of slotCountsRaw) {
    if (s._id) slotCounts[s._id] = s.count;
  }

  // 4. Eligible per slot
  const eligiblePerSlot: Record<string, number> = {};
  for (const slot of ["D1_LUNCH", "D2_LUNCH", "D2_DINNER", "D3_LUNCH"]) {
    eligiblePerSlot[slot] = allUsers.filter((u) =>
      u.foodSlots?.includes(slot),
    ).length;
  }

  // 5. Settings (certificate release status)
  const settingsDoc = await db
    .collection<{ _id: string; certificatesReleased?: boolean }>("settings")
    .findOne({ _id: "flags" });
  const certificatesReleased = Boolean(settingsDoc?.certificatesReleased);

  // 6. Recent Scan Logs (latest 10, enrich with user name)
  const rawLogs = await db
    .collection("scan_log")
    .find()
    .sort({ claimedAt: -1, at: -1, ts: -1 })
    .limit(10)
    .toArray();

  // Build a quick lookup of user names
  const userMap = new Map<string, string>();
  for (const u of allUsers) {
    userMap.set(String(u._id), u.name);
  }

  const recentLogs = rawLogs.map((log: Record<string, unknown>) => {
    const logTime = log.claimedAt;
    const isOk = log.status === "OK";
    const userId = typeof log.userId === "string" ? log.userId : undefined;
    const rawIdPrefix = typeof log.rawIdPrefix === "string" ? log.rawIdPrefix : undefined;
    const logName = typeof log.name === "string" ? log.name : undefined;
    const userName =
      logName ||
      (userId ? userMap.get(userId) : null) ||
      rawIdPrefix ||
      null;

    return {
      _id: (log._id as { toString?: () => string })?.toString?.() || Math.random().toString(),
      action: "scan",
      slot: typeof log.slot === "string" ? log.slot : "—",
      volunteer: typeof log.volunteer === "string" ? log.volunteer : "unknown",
      success: isOk,
      reason: typeof log.status === "string" ? log.status : isOk ? "SUCCESS" : "DENIED",
      pid: userId || rawIdPrefix || "",
      name: userName || "—",
      ts:
        logTime instanceof Date
          ? logTime.toISOString()
          : typeof logTime === "string" || typeof logTime === "number"
            ? new Date(logTime).toISOString()
            : new Date().toISOString(),
    };
  });

  // 7. Volunteers list
  const volunteers = await db
    .collection("volunteers")
    .find({}, { projection: { passwordHash: 0 } })
    .sort({ name: 1 })
    .toArray();

  // 8. Per-slot roster: eligible participants + their claim status
  const allClaims = await db.collection("meal_claims").find().toArray();
  // Build set of claimed userId per slot
  const claimsBySlot: Record<string, Map<string, { claimedAt: Date; claimedBy: string }>> = {};
  for (const slot of ["D1_LUNCH", "D2_LUNCH", "D2_DINNER", "D3_LUNCH"]) {
    claimsBySlot[slot] = new Map();
  }
  for (const claim of allClaims) {
    const slot = claim.slot as string;
    if (claimsBySlot[slot]) {
      claimsBySlot[slot].set(String(claim.userId), {
        claimedAt: claim.claimedAt,
        claimedBy: claim.claimedBy || claim.volunteer || "unknown",
      });
    }
  }

  const roster: Record<string, { userId: string; name: string; served: boolean; claimedAt?: string; claimedBy?: string }[]> = {};
  for (const slot of ["D1_LUNCH", "D2_LUNCH", "D2_DINNER", "D3_LUNCH"]) {
    const eligible = allUsers.filter((u) => (u.foodSlots ?? []).includes(slot));
    roster[slot] = eligible.map((u) => {
      const claim = claimsBySlot[slot].get(String(u._id));
      return {
        userId: String(u._id),
        name: u.name,
        served: Boolean(claim),
        claimedAt: claim?.claimedAt instanceof Date ? claim.claimedAt.toISOString() : claim?.claimedAt ? new Date(claim.claimedAt).toISOString() : undefined,
        claimedBy: claim?.claimedBy,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }

  return NextResponse.json({
    totalUsers,
    categoryCounts,
    slotCounts,
    eligiblePerSlot,
    certificatesReleased,
    recentLogs,
    volunteers,
    roster,
  });
}

// POST: Actions (toggle certificates, add volunteer)
export async function POST(req: NextRequest) {
  const isAuth = await getAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const body = await req.json();

  if (body.action === "toggle-certificates") {
    const currentState = Boolean(body.released);
    await db
      .collection<{ _id: string; certificatesReleased?: boolean; updatedAt?: Date }>("settings")
      .updateOne(
        { _id: "flags" },
        { $set: { certificatesReleased: currentState, updatedAt: new Date() } },
        { upsert: true },
      );
    return NextResponse.json({ ok: true, certificatesReleased: currentState });
  }

  if (body.action === "create-volunteer") {
    const { name, password } = body;
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Volunteer name must be at least 2 characters" },
        { status: 400 },
      );
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const cleanName = name.trim().toLowerCase();
    const existing = await db
      .collection("volunteers")
      .findOne({ name: cleanName });
    if (existing) {
      return NextResponse.json(
        { error: `Volunteer '${cleanName}' already exists` },
        { status: 400 },
      );
    }

    const passwordHash = hashPassword(password);
    await db.collection("volunteers").insertOne({
      name: cleanName,
      passwordHash,
      role: "volunteer",
      active: true,
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true, volunteer: cleanName });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
