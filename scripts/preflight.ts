// Preflight verification: checks database, volunteers, QR codes, and settings
// Usage: npx tsx scripts/preflight.ts

import fs from "node:fs";
import path from "node:path";
import { db, type UserDoc, type VolunteerDoc } from "../lib/db";
import { certificatesReleased } from "../lib/flags";
import { parseCsv } from "../lib/master";

async function main() {
  console.log("=========================================");
  console.log("       ICAA 2027 SYSTEM PREFLIGHT        ");
  console.log("=========================================\n");

  const d = await db();
  let passed = 0;
  let failed = 0;

  const pass = (desc: string) => {
    console.log(`[PASS] ${desc}`);
    passed++;
  };
  const fail = (desc: string) => {
    console.error(`[FAIL] ${desc}`);
    failed++;
  };
  const warn = (desc: string) => {
    console.warn(`[WARN] ${desc}`);
  };

  // 1. Database Connection & Users
  try {
    const users = await d.collection<UserDoc>("users").find({}).toArray();
    if (users.length > 0) {
      pass(
        `MongoDB connected: ${users.length} registered participant(s) in database`,
      );
    } else {
      warn("Database connected, but no participants found (run: npm run seed)");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    fail(`MongoDB connection failed: ${message}`);
  }

  // 2. Token Map & QR files
  const tokenMapPath = path.join("out", "token_map.csv");
  if (fs.existsSync(tokenMapPath)) {
    const [, ...rows] = parseCsv(fs.readFileSync(tokenMapPath, "utf8"));
    pass(`Token map exists with ${rows.length} participant records`);

    const qrDir = path.join("out", "qrs");
    if (fs.existsSync(qrDir)) {
      const pngs = fs.readdirSync(qrDir).filter((f) => f.endsWith(".png"));
      if (pngs.length >= rows.length && rows.length > 0) {
        pass(`QR images generated: ${pngs.length} PNGs available in out/qrs`);
      } else {
        warn(`Found ${pngs.length} QR images for ${rows.length} participants`);
      }
    } else {
      warn("out/qrs directory not found (run: npm run generate-qrs)");
    }
  } else {
    warn("out/token_map.csv not found (run: npm run seed)");
  }

  // 3. Volunteer Accounts
  const vols = d.collection<VolunteerDoc>("volunteers");
  const volCount = await vols.countDocuments({
    role: "volunteer",
    active: true,
  });
  const adminCount = await vols.countDocuments({ role: "admin", active: true });
  if (volCount > 0 || adminCount > 0) {
    pass(
      `Volunteer accounts configured: ${volCount} volunteer(s), ${adminCount} admin(s)`,
    );
  } else {
    warn(
      "No volunteer accounts found (create one: npm run create-volunteer <name> <pin>)",
    );
  }

  // 4. Google Drive Configuration
  if (process.env.GOOGLE_SA_KEY && process.env.DRIVE_FOLDER_ID) {
    pass("Google Drive credentials configured");
  } else {
    warn(
      "GOOGLE_SA_KEY or DRIVE_FOLDER_ID not set in .env (needed for certificate sync)",
    );
  }

  // 5. Certificate Release Status
  const released = await certificatesReleased();
  console.log(
    `\n[STATUS] Certificate Downloads: ${released ? "RELEASED (publicly active)" : "LOCKED (standard pre-event state)"}`,
  );

  console.log("\n-----------------------------------------");
  console.log(`Preflight Complete: ${passed} Checks Passed, ${failed} Failed`);
  console.log("=========================================\n");

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Preflight execution error:", e);
  process.exit(1);
});
