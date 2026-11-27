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
  ClipboardList,
  Boxes,
  HandCoins,
  ChartColumn,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: LucideIcon; feature: string };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    label: "主畫面",
    items: [{ label: "總覽", href: "/", icon: LayoutDashboard, feature: "dashboard" }],
  },
  {
    label: "進貨流程",
    items: [
      { label: "詢價單", href: "/purchasing/rfq", icon: ClipboardList, feature: "purchaseOrder" },
      { label: "採購訂單", href: "/purchasing/orders", icon: ShoppingCart, feature: "purchaseOrder" },
      { label: "入庫作業", href: "/purchasing/receiving", icon: Boxes, feature: "receiving" },
      { label: "進項發票對帳", href: "/finance/ap", icon: HandCoins, feature: "invoice" },
    ],
  },
  {
    label: "銷貨流程",
    items: [
      { label: "客戶管理", href: "/sales/customers", icon: Users, feature: "customer" },
      { label: "報價單", href: "/sales/quotes", icon: FileText, feature: "quote" },
      { label: "銷貨訂單", href: "/sales/orders", icon: ShoppingCart, feature: "salesOrder" },
      { label: "出貨作業", href: "/sales/shipments", icon: Truck, feature: "shipment" },
      { label: "應收帳款", href: "/finance/receivables", icon: HandCoins, feature: "receivable" },
    ],
  },
  {
    label: "帳務與發票",
    items: [
      { label: "利潤計算表", href: "/finance/profit", icon: Wallet, feature: "profit" },
      { label: "發票管理", href: "/finance/invoices", icon: ReceiptText, feature: "invoice" },
      { label: "稅務彙總報表", href: "/finance/tax-summary", icon: ChartColumn, feature: "invoice" },
    ],
  },
  {
    label: "管理介面",
    items: [
      { label: "商品管理", href: "/master/products", icon: Package, feature: "inventory" },
      { label: "供應商管理", href: "/master/suppliers", icon: Users, feature: "purchaseOrder" },
      { label: "庫存查詢", href: "/master/inventory", icon: Boxes, feature: "inventory" },
      { label: "系統設定", href: "/admin/settings", icon: Settings, feature: "settings" },
      { label: "權限設定", href: "/admin/permissions", icon: ShieldCheck, feature: "settings" },
    ],
  },
];

type User = {
  name?: string | null;
  email?: string | null;
  role?: string;
  accountType?: string;
};

/**
 * 依帳號類型的功能可見範圍決定選單顯示。
 * 員工（預設）顯示全部；其他類型僅顯示設定為非遮蔽的功能。
 */
function isVisible(feature: string, visibility: Record<string, string>, accountType: string) {
  if (accountType === "employee") return true;
  const level = visibility[feature];
  return level !== undefined && level !== "hidden";
}

export function AppShell({
  user,
  visibility,
  children,
}: {
  user: User;
  visibility: Record<string, string>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const accountType = user.accountType ?? "employee";

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
          {groups.map((group) => {
            const items = group.items.filter((item) => isVisible(item.feature, visibility, accountType));
            if (items.length === 0) return null;
            return (
              <div key={group.label} className="mb-4">
                <div className="mb-1 px-3 text-[10px] tracking-widest text-[#aaa5bd]">
                  {group.label}
                </div>
                {items.map((item) => {
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
            );
          })}
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
              {accountType}
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
