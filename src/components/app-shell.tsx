"use client";

import { useState, useEffect } from "react";
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
  Menu,
  X,
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
    label: "人資模組",
    items: [
      { label: "員工管理", href: "/hr/employees", icon: Users, feature: "hr" },
      { label: "部門管理", href: "/hr/departments", icon: Boxes, feature: "hr" },
      { label: "出勤紀錄", href: "/hr/attendance", icon: ClipboardList, feature: "hr" },
      { label: "請假管理", href: "/hr/leaves", icon: FileText, feature: "hr" },
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
      { label: "技術組合", href: "/blueprint", icon: ClipboardList, feature: "settings" },
      { label: "規格索引", href: "/spec", icon: FileText, feature: "settings" },
    ],
  },
];

type User = {
  name?: string | null;
  email?: string | null;
  role?: string;
  accountType?: string;
};

/** 依帳號類型的功能可見範圍決定選單顯示。 */
function isVisible(feature: string, visibility: Record<string, string>, accountType: string) {
  if (accountType === "employee") return true;
  const level = visibility[feature];
  return level !== undefined && level !== "hidden";
}

function SidebarContent({
  groups,
  visibility,
  accountType,
  pathname,
  onNavigate,
}: {
  groups: NavGroup[];
  visibility: Record<string, string>;
  accountType: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {groups.map((group) => {
          const items = group.items.filter((item) => isVisible(item.feature, visibility, accountType));
          if (items.length === 0) return null;
          return (
            <div key={group.label} className="mb-4">
              <div className="mb-1 px-3 text-[10px] tracking-widest text-[#aaa5bd]">{group.label}</div>
              {items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "mb-0.5 flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-[13px] no-underline",
                      active ? "bg-[#6d4aff] text-white shadow-sm" : "text-[#57536e] hover:bg-[#e9e3fb]",
                    )}
                  >
                    <Icon size={15} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
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
          className="flex min-h-10 w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-[#57536e] hover:bg-[#e9e3fb]"
        >
          <LogOut size={14} className="shrink-0" />
          登出
        </button>
      </div>
    </>
  );
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
  const [menuOpen, setMenuOpen] = useState(false);

  // 換頁時自動收合手機選單
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <div className="flex min-h-screen">
      {/* 桌面側欄 */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-[#e9e6f3] bg-[#f3f0fc] md:flex">
        <div className="flex items-center gap-2 border-b border-[#e9e6f3] px-4 py-4">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#6d4aff] text-xs font-semibold text-white">
            KST
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">ERP System</div>
            <div className="truncate text-[10px] text-[#8c88a6]">進銷存管理模組</div>
          </div>
        </div>
        <SidebarContent groups={groups} visibility={visibility} accountType={accountType} pathname={pathname} />
      </aside>

      {/* 手機滑出選單 */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="關閉選單"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 max-w-[85vw] flex-col border-r border-[#e9e6f3] bg-[#f3f0fc] shadow-xl">
            <div className="flex items-center gap-2 border-b border-[#e9e6f3] px-4 py-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#6d4aff] text-xs font-semibold text-white">
                KST
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">ERP System</div>
                <div className="truncate text-[10px] text-[#8c88a6]">{user.name ?? user.email ?? "進銷存管理模組"}</div>
              </div>
              <button aria-label="關閉" onClick={() => setMenuOpen(false)} className="rounded p-1 text-[#57536e]">
                <X size={18} />
              </button>
            </div>
            <SidebarContent
              groups={groups}
              visibility={visibility}
              accountType={accountType}
              pathname={pathname}
              onNavigate={() => setMenuOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex min-h-14 items-center justify-between gap-2 border-b border-[#e9e6f3] bg-white px-3 py-2 md:px-6">
          <div className="flex min-w-0 items-center gap-2 text-xs text-[#8c88a6]">
            <button
              aria-label="開啟選單"
              onClick={() => setMenuOpen(true)}
              className="rounded-lg border border-[#e9e6f3] p-2 text-[#57536e] md:hidden"
            >
              <Menu size={18} />
            </button>
            <span className="hidden sm:inline">K.S.T</span>
            <ChevronRight size={12} className="hidden sm:inline" />
            <span className="truncate">{user.role ?? "viewer"}</span>
          </div>
          <div className="flex min-w-0 items-center gap-2 text-xs md:gap-3">
            <span className="hidden truncate rounded-full border border-[#e9e6f3] bg-[#faf9ff] px-3 py-1.5 sm:inline">
              {accountType}
            </span>
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#06c755] font-medium text-white">
              {(user.name ?? user.email ?? "U").slice(0, 1).toUpperCase()}
            </div>
            <span className="hidden max-w-40 truncate lg:inline">{user.name ?? user.email}</span>
          </div>
        </header>
        <main className="min-w-0 p-3 md:p-6">{children}</main>
      </div>
    </div>
  );
}
