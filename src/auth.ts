import NextAuth from "next-auth";
import LINE from "next-auth/providers/line";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import authConfig from "@/auth.config";
import { db } from "@/db";
import { accounts, users, verificationTokens } from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    verificationTokensTable: verificationTokens,
  }),
  secret: process.env.AUTH_SECRET,
  providers: [
    LINE({
      clientId: process.env.AUTH_LINE_ID ?? "",
      clientSecret: process.env.AUTH_LINE_SECRET ?? "",
    }),
    ...(process.env.AUTH_ENABLE_GOOGLE === "true"
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID ?? "",
            clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
          }),
        ]
      : []),
  ],
  events: {
    async createUser({ user }) {
      // 第一个登入的账号自动成为最高权限管理员
      if (!user.id) return;
      const all = await db.select({ id: users.id }).from(users);
      if (all.length === 1) {
        await db
          .update(users)
          .set({ role: "admin", accountType: "employee", status: "active" })
          .where(eq(users.id, user.id));
      }
    },
  },
  callbacks: {
    async signIn({ account }) {
      // LINE 预设不回传 email，不能以此作为准入条件。
      // TODO: 之后改为检查 external_identity 白名单与启用状态。
      return account?.provider === "line" || account?.provider === "google";
    },
    async jwt({ token, user }) {
      // 首次登入時由 adapter 帶入 user，之後以 token.sub 查回最新角色資訊。
      const userId = user?.id ?? (token.sub as string | undefined);
      if (!userId) return token;

      const [record] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (record) {
        token.userId = record.id;
        token.accountType = record.accountType;
        token.role = record.role;
        token.dataScope = record.dataScope;
      } else {
        token.userId = userId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as {
          id?: string;
          accountType?: string;
          role?: string;
          dataScope?: string | null;
        };
        u.id = (token.userId as string) ?? (token.sub as string);
        u.accountType = token.accountType as string;
        u.role = token.role as string;
        u.dataScope = (token.dataScope as string | null) ?? null;
      }
      return session;
    },
  },
});
