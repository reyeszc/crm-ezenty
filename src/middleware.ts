import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes — no auth needed
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/agenda/") ||
    pathname.startsWith("/landing") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/landing") ||
    pathname.startsWith("/api/agenda") ||
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public");

  if (isPublic) return NextResponse.next();

  // Check for session token (NextAuth JWT)
  const token =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)",
  ],
};
