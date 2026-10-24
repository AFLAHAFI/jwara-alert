import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Admin: mark a task done / not done. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let body: { done?: unknown } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!body || typeof body.done !== "boolean") {
    return NextResponse.json({ error: "done must be true or false" }, { status: 400 });
  }
  try {
    const { data, error } = await supabaseAdmin()
      .from("tasks")
      .update({ done: body.done })
      .eq("id", params.id)
      .select("id, alert_id, ward, title, done, created_at");
    if (error) throw error;
    if (!data || data.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ task: data[0] });
  } catch (err) {
    console.error("[api/tasks/:id] update failed", err);
    return NextResponse.json({ error: "Could not update task" }, { status: 500 });
  }
}
