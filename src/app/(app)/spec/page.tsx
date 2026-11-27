import Link from "next/link";
import { PageHeader } from "@/components/page-header";

export const instant = false;

const GROUPS = [
  { name: "總覽", items: [["/", "首頁總覽"]] },
  { name: "業務", items: [["/sales/customers", "客戶管理"], ["/sales/quotes", "報價單"], ["/sales/orders", "銷貨訂單"], ["/sales/shipments", "出貨作業"]] },
  { name: "採購", items: [["/purchasing/rfq", "詢價單"], ["/purchasing/orders", "採購訂單"], ["/purchasing/receiving", "入庫作業"]] },
  { name: "財務", items: [["/finance/invoices", "發票管理"], ["/finance/ap", "進項發票對帳"], ["/finance/receivables", "應收帳款"], ["/finance/profit", "利潤與分潤"], ["/finance/tax-summary", "稅務彙總"]] },
  { name: "主數據", items: [["/master/products", "商品管理"], ["/master/suppliers", "供應商管理"], ["/master/inventory", "庫存查詢"]] },
  { name: "人資", items: [["/hr", "人資總覽"], ["/hr/employees", "員工管理"], ["/hr/departments", "部門管理"], ["/hr/attendance", "出勤紀錄"], ["/hr/leaves", "請假管理"]] },
  { name: "管理", items: [["/admin/accounts", "帳號管理"], ["/admin/permissions", "權限設定"], ["/admin/settings", "系統設定"], ["/blueprint", "技術組合"], ["/spec", "本規格頁"]] },
];

export default function SpecPage() {
  return (
    <>
      <PageHeader title="開發規格 / 路徑索引" subtitle="所有正式版路徑一覽 · 完整規格見 kst-erp-preview/DEV-SPEC.md" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {GROUPS.map((g) => (
          <section key={g.name} className="rounded-xl border border-[#e9e6f3] bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-[#5538d6]">{g.name}</h2>
            <ul className="space-y-2">
              {g.items.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-xs text-[#57536e] no-underline hover:text-[#6d4aff]">
                    {label} <span className="ml-1 text-[10px] text-[#aaa5bd]">{href}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
