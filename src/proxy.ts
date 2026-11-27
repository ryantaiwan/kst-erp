import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

/**
 * Next.js 16 已將 `middleware.ts` 更名為 `proxy.ts`（舊名仍可用但已棄用）。
 * Proxy 在路由 render 前執行，預設跑在 Node.js runtime。
 * 職責：擋下未登入者導向 /signin。
 */

/** 需要登入才能進入的路徑前綴 */
const PROTECTED = [
  "/sales", "/purchasing", "/finance", "/master", "/admin", "/hr", "/blueprint", "/spec",
  "/api/shipments", "/api/purchase-orders",
];

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
    "/hr/:path*",
    "/blueprint/:path*",
    "/spec/:path*",
    "/api/shipments/:path*",
    "/api/purchase-orders/:path*",
  ],
};
