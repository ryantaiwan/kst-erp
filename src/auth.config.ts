import type { NextAuthConfig } from "next-auth";

export default {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [],
  pages: { signIn: "/signin" },
} satisfies NextAuthConfig;
