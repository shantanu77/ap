import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicApiPaths = new Set([
  "/api/auth/request-code",
  "/api/auth/verify-code",
  "/api/board/reminder",
  "/api/generate",
]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/" || pathname === "/login" || pathname.startsWith("/login/") || pathname.startsWith("/brand/") || publicApiPaths.has(pathname)) {
    return NextResponse.next();
  }

  if (request.cookies.has("ap_kid_session")) return NextResponse.next();
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
