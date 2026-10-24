import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/authz";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { LANG_COOKIE, isLang } from "@/lib/i18n";
import { LANG_COOKIE_OPTIONS } from "@/lib/i18n/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sets the UI language cookie, and saves it on the account when logged in. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { lang?: unknown } | null;
  const lang = body?.lang;
  if (!isLang(lang)) return NextResponse.json({ error: "Invalid language" }, { status: 400 });

  const user = await getCurrentUser();
  if (user) {
    const { error } = await supabaseAdmin().from("profiles").update({ lang }).eq("id", user.id);
    if (error) console.error("[api/lang] save failed", error);
  }
  const res = NextResponse.json({ ok: true, lang });
  res.cookies.set(LANG_COOKIE, lang, LANG_COOKIE_OPTIONS);
  return res;
}
