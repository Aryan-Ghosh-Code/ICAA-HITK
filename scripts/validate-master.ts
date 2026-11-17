// Validates data/master.csv
// Usage: npx tsx scripts/validate-master.ts [data/master.csv]

import fs from "node:fs";
import { validateMaster } from "../lib/master";
import { PID_PREFIX } from "../constants/2027/categories";

const file = process.argv[2] || "data/master.csv";
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

const errors = issues.filter((i) => i.level === "error").length;
const warns = issues.length - errors;
const totalPids = rows.reduce((n, r) => n + r.pids.length, 0);

console.log(
  `\nValidation Result: ${rows.length} participants, ${totalPids} PIDs, ${errors} error(s), ${warns} warning(s)`,
);

process.exit(errors > 0 ? 1 : 0);
