import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: mark a task done / not done. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  let body: { done?: unknown } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || typeof body.done !== "boolean") {
    return NextResponse.json({ error: "done must be true or false" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin()
      .from("tasks")
      .update({ done: body.done })
      .eq("id", params.id)
      .is("panchayat_id", null)
      .select("id, alert_id, ward, title, done, created_at")
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json({ task: data });
  } catch (err) {
    console.error("[api/tasks/:id] update failed", err);
    return NextResponse.json({ error: "Could not update task" }, { status: 500 });
  }
}
