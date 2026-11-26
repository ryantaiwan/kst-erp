import type { NextAuthConfig } from "next-auth";

/**
 * middleware 與主 auth 共用的基礎設定。
 * 使用 JWT session 策略，middleware 不需連線資料庫即可驗證登入狀態。
 */
export default {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [],
  pages: { signIn: "/signin" },
} satisfies NextAuthConfig;
