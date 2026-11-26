import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { featureVisibility } from "@/db/schema";
import { AppShell } from "@/components/app-shell";

export const instant = false;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const u = session.user as {
    name?: string | null;
    email?: string | null;
    role?: string;
    accountType?: string;
    id?: string;
  };

  const accountType = u.accountType ?? "employee";

  // 依帳號類型取得功能可見範圍；未設定者視為遮蔽
  const visibility = await db
    .select()
    .from(featureVisibility)
    .where(eq(featureVisibility.accountType, accountType));

  const levelMap = new Map(visibility.map((v) => [v.featureKey, v.level]));

  return (
    <AppShell
      user={{ name: u.name, email: u.email, role: u.role, accountType }}
      visibility={Object.fromEntries(levelMap.entries())}
    >
      {children}
    </AppShell>
  );
}
