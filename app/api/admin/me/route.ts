import { getSession } from "@/lib/auth";
import { json } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return json({ error: "Unauthorized" }, 401);
  return json({ name: session.name, role: session.role });
}
