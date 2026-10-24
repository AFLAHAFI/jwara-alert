import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lets the PIN gate check a PIN without exposing anything else. */
export async function POST(req: Request) {
  return requireAdmin(req) ?? NextResponse.json({ ok: true });
}
