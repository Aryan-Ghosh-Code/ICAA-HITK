// Admin CLI operations:
//   report                          claimed vs eligible per meal slot (caterer headcount)
//   find <text>                     search by name or PID
//   undo <PID|id> <SLOT>            delete a wrongly recorded food claim
//   release on|off                  show / hide certificate downloads
//   reissue <PID|id>                lost card: generate new QR token
//   export-claims                   writes out/claims.csv for caterer reconciliation

import fs from "node:fs";
import path from "node:path";
import {
  db,
  mongoClient,
  type UserDoc,
  type ClaimDoc,
  type SettingsDoc,
  type ScanLogDoc,
} from "../lib/db";
import { MEAL_SLOTS } from "../constants/2027/mealSlots";
import { ID_RE, newId } from "../lib/ids";

const [cmd, arg1, arg2] = process.argv.slice(2);
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const ist = (d: Date) =>
  d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

async function main() {
  const d = await db();
  const users = d.collection<UserDoc>("users");
  const claims = d.collection<ClaimDoc>("meal_claims");

  const person = async (key: string) =>
    await users.findOne(ID_RE.test(key) ? { _id: key } : { PIDs: key });

  if (cmd === "report") {
    console.log(`\n=== ICAA 2027 Meal Headcount Report ===`);
    console.log(
      `Total Registered Participants: ${await users.countDocuments()}\n`,
    );

    for (const s of MEAL_SLOTS) {
      const eligible = await users.countDocuments({ foodSlots: s.id });
      const claimed = await claims.countDocuments({ slot: s.id });
      const remaining = Math.max(0, eligible - claimed);
      console.log(
        `${s.label.padEnd(20)} Claimed: ${String(claimed).padStart(3)} / Eligible: ${String(eligible).padStart(3)} | Remaining: ${remaining}`,
      );
    }
  } else if (cmd === "find" && arg1) {
    const rx = new RegExp(esc(arg1), "i");
    const found = await users
      .find({ $or: [{ name: rx }, { PIDs: rx }] })
      .toArray();

    if (!found.length) {
      console.log(`No users found matching "${arg1}"`);
    }

    for (const u of found) {
      const got =
        (await claims.find({ userId: u._id }).toArray())
          .map((c) => c.slot)
          .join(", ") || "none";
      console.log(
        `\n${u.name}  [${u.PIDs.join(", ")}]\n  ID: ${u._id}\n  Food slots: ${u.foodSlots.join(", ") || "none"}\n  Claimed: ${got}`,
      );
    }
  } else if (cmd === "undo" && arg1 && arg2) {
    const u = await person(arg1);
    if (!u) {
      console.log("No such person found.");
      process.exit(1);
    }
    const r = await claims.deleteOne({ userId: u._id, slot: arg2 });
    if (r.deletedCount > 0) {
      await d.collection<ScanLogDoc>("scan_log").insertOne({
        claimedAt: new Date(),
        volunteer: "cli-admin",
        slot: arg2,
        status: "UNDONE",
        userId: u._id,
      });
      console.log(`Removed ${arg2} claim for ${u.name}`);
    } else {
      console.log(`No existing claim found for ${u.name} on slot ${arg2}`);
    }
  } else if (cmd === "release" && (arg1 === "on" || arg1 === "off")) {
    await d
      .collection<SettingsDoc>("settings")
      .updateOne(
        { _id: "flags" },
        { $set: { certificatesReleased: arg1 === "on" } },
        { upsert: true },
      );
    console.log(
      `\nCertificates are now ${arg1 === "on" ? "RELEASED (publicly downloadable)" : "LOCKED / HIDDEN"}`,
    );
  } else if (cmd === "reissue" && arg1) {
    const old = await person(arg1);
    if (!old) {
      console.log("No such person found.");
      process.exit(1);
    }

    const nid = newId();
    const client = await mongoClient();
    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        await users.deleteOne({ _id: old._id }, { session });
        await users.insertOne({ ...old, _id: nid }, { session });
        await claims.updateMany(
          { userId: old._id },
          { $set: { userId: nid } },
          { session },
        );
      });
      console.log(
        `Card reissued for ${old.name}!\n  Old ID: ${old._id} (INVALIDATED)\n  New ID: ${nid}\n\nRe-run seed-users and generate-qrs, then reprint this single card.`,
      );
    } finally {
      await session.endSession();
    }
  } else if (cmd === "export-claims") {
    const allClaims = await claims.find({}).toArray();
    fs.mkdirSync("out", { recursive: true });

    const rows = ["name,primary_pid,slot,claimedAt,claimedBy"];
    for (const c of allClaims) {
      const u = await users.findOne({ _id: c.userId });
      const name = u ? `"${u.name.replace(/"/g, '""')}"` : "Unknown";
      const primaryPid = u?.PIDs[0] ?? "";
      rows.push(
        `${name},${primaryPid},${c.slot},"${ist(c.claimedAt)}",${c.claimedBy}`,
      );
    }
    const claimsPath = path.join("out", "claims.csv");
    fs.writeFileSync(claimsPath, rows.join("\n") + "\n");
    console.log(`Exported ${allClaims.length} meal claims to ${claimsPath}`);
  } else {
    console.log(
      "usage: npx tsx scripts/admin.ts report | find <text> | undo <PID|id> <SLOT> | release on|off | reissue <PID|id> | export-claims",
    );
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
