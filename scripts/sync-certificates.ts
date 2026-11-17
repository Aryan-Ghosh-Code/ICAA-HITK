// Reads the designated Google Drive folder, matches <PID>.pdf to users in MongoDB,
// and saves the Google Drive file ID into users.certs.<PID>.
// Usage: npx tsx scripts/sync-certificates.ts [--dry]

import { db, type UserDoc } from "../lib/db";
import { listDriveCertificates } from "../lib/drive";
import { pidShape } from "../lib/ids";
import { PID_PREFIX } from "../constants/2027/categories";

const DRY = process.argv.includes("--dry");

async function main() {
  console.log("Connecting to Google Drive...");
  const files = await listDriveCertificates();
  console.log(`Found ${files.length} file(s) in Google Drive folder.`);

  const shape = pidShape(PID_PREFIX);
  const d = await db();
  const users = d.collection<UserDoc>("users");

  const seenPids = new Set<string>();
  let matched = 0;

  for (const f of files) {
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      console.log(`SKIP      ${f.name} (not a PDF)`);
      continue;
    }

    const pid = f.name.replace(/\.pdf$/i, "");
    if (!shape.test(pid)) {
      console.log(
        `SKIP      ${f.name} (name does not match ${PID_PREFIX}_<CAT>_<3 digits>)`,
      );
      continue;
    }

    if (seenPids.has(pid)) {
      console.log(`DUPLICATE ${f.name} (duplicate file for ${pid} ignored)`);
      continue;
    }
    seenPids.add(pid);

    const user = await users.findOne({ PIDs: pid });
    if (!user) {
      console.log(`ORPHAN    ${f.name} (no participant has PID ${pid})`);
      continue;
    }

    console.log(`MATCHED   ${pid} -> ${user.name} (${f.id})`);
    matched++;

    if (!DRY) {
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            [`certs.${pid}`]: {
              fileId: f.id,
              fileName: f.name,
              syncedAt: new Date(),
            },
          },
        },
      );
    }
  }

  const allUsers = await users.find({}).toArray();
  let missing = 0;
  for (const u of allUsers) {
    for (const pid of u.PIDs) {
      if (!seenPids.has(pid)) {
        console.log(`MISSING   ${pid} (${u.name}) has no PDF in Drive`);
        missing++;
      }
    }
  }

  console.log(
    `\nSync Summary: ${matched} matched, ${missing} missing${DRY ? " [DRY RUN]" : ""}`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error("Sync error:", e.message);
  process.exit(1);
});
