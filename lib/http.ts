import { NextResponse } from "next/server";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Parses a JSON object body, or returns a 400 response. */
export async function readJson(
  req: Request,
): Promise<{ body: Record<string, unknown>; error?: undefined } | { body?: undefined; error: NextResponse }> {
  try {
    const body = await req.json();
    if (body && typeof body === "object" && !Array.isArray(body)) return { body };
  } catch {}
  return { error: NextResponse.json({ error: "Invalid request" }, { status: 400 }) };
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function fail(where: string, err: unknown, message = "Something went wrong") {
  console.error(`[${where}] failed`, err);
  return NextResponse.json({ error: message }, { status: 500 });
}
