"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Truck,
  ReceiptText,
  Wallet,
  Package,
  Users,
  Settings,
  ShieldCheck,
  ChevronRight,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    label: "主畫面",
    items: [{ label: "總覽", href: "/", icon: LayoutDashboard }],
  },
  {
    label: "進貨流程",
    items: [
      { label: "採購訂單", href: "/purchasing/orders", icon: ShoppingCart },
    ],
  },
  {
    label: "銷貨流程",
    items: [
      { label: "客戶管理", href: "/sales/customers", icon: Users },
      { label: "報價單", href: "/sales/quotes", icon: FileText },
      { label: "銷貨訂單", href: "/sales/orders", icon: ShoppingCart },
      { label: "出貨作業", href: "/sales/shipments", icon: Truck },
    ],
  },
  {
    label: "帳務與發票",
    items: [
      { label: "利潤計算表", href: "/finance/profit", icon: Wallet },
      { label: "發票管理", href: "/finance/invoices", icon: ReceiptText },
    ],
  },
  {
    label: "管理介面",
    items: [
      { label: "商品管理", href: "/master/products", icon: Package },
      { label: "供應商管理", href: "/master/suppliers", icon: Users },
      { label: "系統設定", href: "/admin/settings", icon: Settings },
      { label: "權限設定", href: "/admin/permissions", icon: ShieldCheck },
    ],
  },
];

type User = {
  name?: string | null;
  email?: string | null;
  role?: string;
  accountType?: string;
};

export function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-56 flex-col border-r border-[#e9e6f3] bg-[#f3f0fc]">
        <div className="flex items-center gap-2 border-b border-[#e9e6f3] px-4 py-4">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#6d4aff] text-xs font-semibold text-white">
            KST
          </div>
          <div>
            <div className="text-sm font-semibold">ERP System</div>
            <div className="text-[10px] text-[#8c88a6]">進銷存管理模組</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {groups.map((group) => (
            <div key={group.label} className="mb-4">
              <div className="mb-1 px-3 text-[10px] tracking-widest text-[#aaa5bd]">
                {group.label}
              </div>
              {group.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "mb-0.5 flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] no-underline",
                      active
                        ? "bg-[#6d4aff] text-white shadow-sm"
                        : "text-[#57536e] hover:bg-[#e9e3fb]",
                    )}
                  >
                    <Icon size={15} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-[#e9e6f3] px-4 py-3">
          <button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-[#57536e] hover:bg-[#e9e3fb]"
          >
            <LogOut size={14} />
            登出
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-[#e9e6f3] bg-white px-6">
          <div className="flex items-center gap-2 text-xs text-[#8c88a6]">
            <span>K.S.T</span>
            <ChevronRight size={12} />
            <span>{user.role ?? "viewer"}</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="rounded-full border border-[#e9e6f3] bg-[#faf9ff] px-3 py-1.5">
              {user.accountType ?? "employee"}
            </span>
            <div className="rounded-full bg-[#06c755] px-2.5 py-1.5 font-medium text-white">
              {(user.name ?? user.email ?? "U").slice(0, 1).toUpperCase()}
            </div>
            <span>{user.name ?? user.email}</span>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
