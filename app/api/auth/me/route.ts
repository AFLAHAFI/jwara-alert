import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/authz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Returns the logged-in user (no password hash) or { user: null }. */
export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user });
}
