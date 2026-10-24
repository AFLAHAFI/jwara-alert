import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: all tasks, open ones first, newest first. */
export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const { data, error } = await supabaseAdmin()
      .from("tasks")
      .select("id, alert_id, ward, title, done, created_at")
      .order("done", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return NextResponse.json({ tasks: data ?? [] });
  } catch (err) {
    console.error("[api/tasks] list failed", err);
    return NextResponse.json({ error: "Could not load tasks" }, { status: 500 });
  }
}
