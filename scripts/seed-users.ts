// Seeds users into MongoDB and writes out/token_map.csv
// Usage: npx tsx scripts/seed-users.ts [data/master.csv] [--dry]

import fs from "node:fs";
import path from "node:path";
import { validateMaster } from "../lib/master";
import { newId } from "../lib/ids";
import { tokenMapCsv } from "../lib/tokenmap";
import { PID_PREFIX } from "../constants/2027/categories";
import { mongoClient, ensureIndexes, type UserDoc } from "../lib/db";

const file = process.argv[2] || "data/master.csv";
const DRY = process.argv.includes("--dry");

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every((x) => b.includes(x));

async function main() {
  if (!fs.existsSync(file)) {
    console.error(`Master file not found: ${file}`);
    process.exit(1);
  }

  const { rows, issues } = validateMaster(fs.readFileSync(file, "utf8"), {
    prefix: PID_PREFIX,
  });
  for (const i of issues) {
    console.log(
      `${i.level.toUpperCase().padEnd(5)} row ${String(i.row).padStart(2)}: ${i.msg}`,
    );
  }

  const errors = issues.filter((i) => i.level === "error");
  if (errors.length > 0) {
    console.error(
      `\nFound ${errors.length} error(s). Please fix the CSV before seeding.`,
    );
    process.exit(1);
  }

  const client = await mongoClient();
  const dbName = process.env.MONGODB_DB;
  const d = client.db(dbName);

  if (!DRY) {
    await ensureIndexes();
  }

  const users = d.collection<UserDoc>("users");

  let inserted = 0;
  let updated = 0;
  let unchanged = 0;
  const conflicts: string[] = [];

  for (const r of rows) {
    const hits = await users.find({ PIDs: { $in: r.pids } }).toArray();
    if (hits.length > 1) {
      conflicts.push(
        `Row ${r.row} "${r.name}": PIDs belong to ${hits.length} different users in the database.`,
      );
      continue;
    }

    if (hits.length === 1) {
      const u = hits[0];
      const changed =
        u.name !== r.name ||
        !sameSet(u.foodSlots, r.foodSlots) ||
        r.pids.some((p) => !u.PIDs.includes(p));

      if (changed && !DRY) {
        await users.updateOne(
          { _id: u._id },
          {
            $set: { name: r.name, foodSlots: r.foodSlots },
            $addToSet: { PIDs: { $each: r.pids } },
          },
        );
      }
      changed ? updated++ : unchanged++;
    } else {
      if (!DRY) {
        await users.insertOne({
          _id: newId(),
          name: r.name,
          PIDs: r.pids,
          foodSlots: r.foodSlots,
          certs: {},
          createdAt: new Date(),
        });
      }
      inserted++;
    }
  }

  console.log(
    `\n${DRY ? "[DRY RUN] " : ""}Processed ${rows.length} rows: ${inserted} inserted, ${updated} updated, ${unchanged} unchanged.`,
  );
  if (conflicts.length > 0) {
    console.warn("\nConflicts detected (not modified):");
    conflicts.forEach((c) => console.warn("  " + c));
  }

  if (!DRY) {
    const all = await users.find({}).toArray();
    fs.mkdirSync("out", { recursive: true });
    const tokenMapPath = path.join("out", "token_map.csv");
    fs.writeFileSync(
      tokenMapPath,
      tokenMapCsv(all, process.env.SITE_URL, PID_PREFIX),
    );
    console.log(
      `\nWrote ${tokenMapPath} (${all.length} participants). Keep this file safe and backed up.`,
    );
  }

  await client.close();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
