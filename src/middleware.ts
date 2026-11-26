import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname !== "/signin") {
    return NextResponse.redirect(new URL("/signin", req.url));
  }
});

export const config = {
  matcher: [
    "/sales/:path*",
    "/purchasing/:path*",
    "/finance/:path*",
    "/master/:path*",
    "/admin/:path*",
  ],
};
