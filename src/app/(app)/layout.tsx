import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const u = session.user as {
    name?: string | null;
    email?: string | null;
    role?: string;
    accountType?: string;
  };

  return (
    <AppShell
      user={{ name: u.name, email: u.email, role: u.role, accountType: u.accountType }}
    >
      {children}
    </AppShell>
  );
}
