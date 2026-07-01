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
    pathname.startsWith("/public") ||
    pathname.match(/\.(png|svg|ico|jpg|jpeg|webp|css|js)$/);

  if (isPublic) return NextResponse.next();

  // Check for session token (NextAuth JWT — both dev and production cookie names)
  const token =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!token) {
    // For API routes return 401, for pages redirect to login
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Security headers on all responses
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
