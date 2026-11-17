import { type NextRequest } from "next/server";
import { db, type UserDoc } from "@/lib/db";
import { ID_RE, parsePid } from "@/lib/ids";
import { certificatesReleased } from "@/lib/flags";
import { openDriveCertificate } from "@/lib/drive";
import { CATEGORIES } from "@/constants/2027/categories";
import { hit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const notFound = () =>
  new Response("Not found", {
    status: 404,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; n: string }> },
) {
  const { id, n: nStr } = await params;
  if (!ID_RE.test(id)) return notFound();

  const n = parseInt(nStr, 10);
  if (isNaN(n) || n < 0 || String(n) !== nStr) return notFound();

  const d = await db();

  // Rate-limit: 30 requests per minute per (ip + id)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rlKey = `cert_dl:${ip}:${id}`;
  const rl = await hit(d, rlKey, { max: 30, windowMs: 60 * 1000 });
  if (!rl.allowed) {
    return new Response("Too many requests", {
      status: 429,
      headers: {
        "Retry-After": String(rl.retryAfterSec),
        "Cache-Control": "private, no-store",
      },
    });
  }

  const user = await d.collection<UserDoc>("users").findOne({ _id: id });
  if (!user || !user.PIDs || n >= user.PIDs.length) return notFound();

  const pid = user.PIDs[n];
  const certEntry = user.certs?.[pid];
  const fileId =
    typeof certEntry === "string" ? certEntry : certEntry?.fileId;
  if (!fileId) return notFound();

  const released = await certificatesReleased();
  if (!released) return notFound();

  const parsed = parsePid(pid);
  if (!parsed) return notFound();

  const certTitle = CATEGORIES[parsed.cat].certificate;
  const filename = `ICAA2027-${certTitle.replace(/\s+/g, "-")}.pdf`;

  try {
    const stream = await openDriveCertificate(fileId);

    return new Response(stream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (err) {
    console.error("Error opening certificate from Google Drive:", err);
    return new Response("Certificate temporarily unavailable", { status: 502 });
  }
}
