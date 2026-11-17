import { CATEGORIES, PID_PREFIX } from "../constants/2027/categories";
import { SLOT_IDS } from "../constants/2027/mealSlots";
import { pidShape } from "./ids";

export interface MasterRow {
  row: number;
  name: string;
  pids: string[];
  foodSlots: string[];
}

export interface Issue {
  level: "error" | "warn";
  row: number;
  msg: string;
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const s = text.replace(/^\uFEFF/, "");
  const flush = () => {
    row.push(field);
    field = "";
    if (row.some((x) => x.trim() !== "")) rows.push(row);
    row = [];
  };
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"' && s[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      flush();
    } else field += c;
  }
  flush();
  return rows;
}

export function expandSlots(spec: string): { slots: string[]; bad: string[] } {
  const s = spec.trim().toUpperCase();
  if (s === "ALL") return { slots: [...SLOT_IDS], bad: [] };
  if (s === "NONE") return { slots: [], bad: [] };
  const parts = s
    .split(";")
    .map((x) => x.trim())
    .filter(Boolean);
  return {
    slots: [...new Set(parts.filter((p) => SLOT_IDS.includes(p)))],
    bad: parts.filter((p) => !SLOT_IDS.includes(p)),
  };
}

const TITLES = new Set([
  "mr",
  "mrs",
  "ms",
  "miss",
  "dr",
  "prof",
  "professor",
  "shri",
  "smt",
  "sri",
]);

export function normalizeName(n: string): string {
  return n
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !TITLES.has(t))
    .join(" ");
}

export function validateMaster(
  text: string,
  opts?: { prefix?: string },
): { rows: MasterRow[]; issues: Issue[] } {
  const issues: Issue[] = [];
  const rows: MasterRow[] = [];
  const err = (row: number, msg: string) =>
    issues.push({ level: "error", row, msg });
  const warn = (row: number, msg: string) =>
    issues.push({ level: "warn", row, msg });

  const prefix = opts?.prefix || PID_PREFIX;
  const shape = pidShape(prefix);

  const table = parseCsv(text);
  if (!table.length) {
    err(0, "file is empty");
    return { rows, issues };
  }
  if (
    table[0].map((h) => h.trim().toLowerCase()).join(",") !==
    "name,pids,food_slots"
  ) {
    err(1, "header must be exactly: name,pids,food_slots");
    return { rows, issues };
  }

  const pidOwner = new Map<string, number>();
  table.slice(1).forEach((cols, i) => {
    const rowNo = i + 2;
    const [name = "", pidsRaw = "", slotsRaw = ""] = cols.map((c) => c.trim());
    if (!name) err(rowNo, "name is empty");

    const pids = pidsRaw
      .split(";")
      .map((p) => p.trim())
      .filter(Boolean);
    if (!pids.length) err(rowNo, "pids is empty");

    const cats = new Set<string>();
    for (const pid of pids) {
      const m = shape.exec(pid);
      if (!m) {
        err(
          rowNo,
          `"${pid}" does not match the expected format ${prefix}_<CAT>_<3 digits>`,
        );
        continue;
      }
      if (!(m[1] in CATEGORIES)) {
        err(
          rowNo,
          `"${pid}": unknown category ${m[1]} (known: ${Object.keys(CATEGORIES).join(", ")})`,
        );
        continue;
      }
      if (cats.has(m[1])) {
        warn(rowNo, `${name} has two PIDs in category ${m[1]}`);
      }
      cats.add(m[1]);

      const owner = pidOwner.get(pid);
      if (owner) err(rowNo, `${pid} is already assigned on row ${owner}`);
      else pidOwner.set(pid, rowNo);
    }

    let foodSlots: string[] = [];
    if (!slotsRaw) {
      err(
        rowNo,
        `food_slots is empty (use ALL, NONE, or a ;-separated list of: ${SLOT_IDS.join(", ")})`,
      );
    } else {
      const { slots, bad } = expandSlots(slotsRaw);
      if (bad.length) err(rowNo, `unknown slot id(s): ${bad.join(", ")}`);
      foodSlots = slots;
    }
    rows.push({ row: rowNo, name, pids, foodSlots });
  });

  return { rows, issues };
}
