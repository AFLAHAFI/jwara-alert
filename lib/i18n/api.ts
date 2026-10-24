import "server-only";
import { NextResponse } from "next/server";
import type { DictKey } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";

/** JSON error in the caller's language. */
export function apiError(key: DictKey, status = 400) {
  return NextResponse.json({ error: getT().t[key] }, { status });
}
