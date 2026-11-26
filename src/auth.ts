import NextAuth from "next-auth";
import LINE from "next-auth/providers/line";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import authConfig from "@/auth.config";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  secret: process.env.AUTH_SECRET,
  session: { strategy: "database" },
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
    async signIn({ user, account }) {
      // TODO: 检查 external_identity 是否已绑定且启用。
      // 未完成绑定前，先在管理员后台建立账号，再于此处加入白名单判断。
      if (!user.email) return false;
      return account?.provider === "line" || account?.provider === "google";
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const [record] = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);
        if (record) {
          token.userId = record.id;
          token.accountType = record.accountType;
          token.role = record.role;
          token.dataScope = record.dataScope;
        }
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
        u.id = token.userId as string;
        u.accountType = token.accountType as string;
        u.role = token.role as string;
        u.dataScope = token.dataScope as string | null;
      }
      return session;
    },
  },
});
