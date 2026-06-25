import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req as NextRequest & { auth: any };
  const isLoggedIn = !!session?.user;

  const isPublic =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/agenda/") ||
    nextUrl.pathname.startsWith("/api/auth") ||
    nextUrl.pathname === "/" ||
    nextUrl.pathname.startsWith("/_next") ||
    nextUrl.pathname.startsWith("/manifest") ||
    nextUrl.pathname.startsWith("/favicon") ||
    nextUrl.pathname.startsWith("/apple-touch");

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isLoggedIn && nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
