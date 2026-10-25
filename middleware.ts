import { NextResponse, type NextRequest } from "next/server";

/**
 * Cross-site request check for every API call that changes something.
 * A browser always sends an Origin header with these requests; when it names another site,
 * the request came from a page that is not ours (cross-site request forgery), so refuse it.
 * The session cookie is also SameSite=Lax, so this is a second layer.
 */
const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

export function middleware(req: NextRequest) {
  if (SAFE.has(req.method)) return NextResponse.next();
  const origin = req.headers.get("origin");
  if (!origin) return NextResponse.next(); // non-browser clients; the cookie rules still apply
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    originHost = "";
  }
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  if (!originHost || originHost !== host) {
    return NextResponse.json({ error: "Request blocked." }, { status: 403 });
  }
  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
