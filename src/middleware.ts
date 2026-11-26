import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

/** 需要登入才能進入的路徑前綴 */
const PROTECTED = ["/sales", "/purchasing", "/finance", "/master", "/admin"];

/** 不需登入即可進入的路徑 */
const PUBLIC = ["/signin", "/api/auth"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const isProtected =
    pathname === "/" || PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isProtected && !req.auth) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/",
    "/sales/:path*",
    "/purchasing/:path*",
    "/finance/:path*",
    "/master/:path*",
    "/admin/:path*",
  ],
};
