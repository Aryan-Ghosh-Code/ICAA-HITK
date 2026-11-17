import { CATEGORIES, PID_PREFIX } from "../constants/2027/categories";
import { parsePid } from "./ids";

const csvCell = (v: string) =>
  /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;

/** One row per person: secret id, primary PID, roles, and the QR url. */
export function tokenMapCsv(
  users: { _id: string; name: string; PIDs: string[] }[],
  siteUrl?: string,
  prefix: string = PID_PREFIX,
): string {
  const base = (
    siteUrl ||
    process.env.SITE_URL ||
    "https://icaa.co.in"
  ).replace(/\/$/, "");
  const sorted = [...users].sort((a, b) =>
    (a.PIDs[0] || "").localeCompare(b.PIDs[0] || ""),
  );
  const lines = ["id,primary_pid,name,roles,url"];
  for (const u of sorted) {
    const roles = [
      ...new Set(
        u.PIDs.map((pid) => parsePid(pid, prefix))
          .filter(Boolean)
          .map((p) => CATEGORIES[p!.cat].role),
      ),
    ].join("; ");
    lines.push(
      [
        u._id,
        u.PIDs[0],
        csvCell(u.name),
        csvCell(roles),
        `${base}/certificates/${u._id}`,
      ].join(","),
    );
  }
  return lines.join("\n") + "\n";
}
