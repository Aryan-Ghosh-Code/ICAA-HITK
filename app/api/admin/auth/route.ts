import { NextRequest, NextResponse } from "next/server";
import {
  createAdminSession,
  clearAdminSession,
  getAdminSession,
} from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json();
    const masterKey = process.env.ADMIN_MASTER_KEY;

    if (!masterKey) {
      return NextResponse.json(
        {
          error:
            "ADMIN_MASTER_KEY is not configured in server environment (.env.local)",
        },
        { status: 500 },
      );
    }

    if (!key || typeof key !== "string") {
      return NextResponse.json(
        { error: "Master key is required" },
        { status: 400 },
      );
    }

    // Timing-safe comparison
    const keyBuf = Buffer.from(key.trim());
    const masterBuf = Buffer.from(masterKey.trim());

    const isMatch =
      keyBuf.length === masterBuf.length &&
      crypto.timingSafeEqual(keyBuf, masterBuf);

    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid admin master key" },
        { status: 401 },
      );
    }

    await createAdminSession();
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Authentication error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE() {
  await clearAdminSession();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const isAuth = await getAdminSession();
  return NextResponse.json({ authenticated: isAuth });
}
