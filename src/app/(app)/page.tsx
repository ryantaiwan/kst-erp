import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, invoices, products, quotes, suppliers } from "@/db/schema";
import { getReceivables } from "@/lib/receivables";
import { formatDate, formatMoney } from "@/lib/utils";

export const instant = false;

export default async function Home() {
  const [customerCount, supplierCount, productCount, quoteRows, invoiceCount, receivables] =
    await Promise.all([
      db.select({ n: sql<number>`count(*)` }).from(customers),
      db.select({ n: sql<number>`count(*)` }).from(suppliers),
      db.select({ n: sql<number>`count(*)` }).from(products),
      db.select().from(quotes).orderBy(desc(quotes.createdAt)).limit(5),
      db.select({ n: sql<number>`count(*)` }).from(invoices),
      getReceivables(),
    ]);

  const totalDue = receivables.filter((r) => r.dueCents > 0).reduce((s, r) => s + r.dueCents, 0);
  const overdueCount = receivables.filter((r) => r.overdue).length;

  const kpis = [
    { label: "客戶數", value: `${customerCount[0]?.n ?? 0}`, tone: "text-[#6d4aff]", hint: "客戶主檔" },
    { label: "供應商數", value: `${supplierCount[0]?.n ?? 0}`, tone: "text-[#06c755]", hint: "廠商主檔" },
    { label: "商品數", value: `${productCount[0]?.n ?? 0}`, tone: "text-[#2563eb]", hint: "商品主檔" },
    { label: "發票筆數", value: `${invoiceCount[0]?.n ?? 0}`, tone: "text-[#f59e0b]", hint: "銷項 + 進項" },
    {
      label: "應收未收",
      value: formatMoney(totalDue),
      tone: "text-[#e05a5a]",
      hint: overdueCount > 0 ? `${overdueCount} 筆逾期` : "無逾期",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="rounded-2xl border border-[#e9e6f3] bg-white p-6 shadow-sm">
        <p className="text-[10px] tracking-widest text-[#8c88a6]">KEENNESS TECHNOLOGY CO., LTD. · K.S.T</p>
        <h1 className="mt-1 text-2xl font-semibold text-[#26223d]">進銷存管理系統</h1>
        <p className="mt-2 max-w-3xl text-xs leading-6 text-[#6f6a89]">
          Vercel + Turso + Next.js 架構 · 報價單金額未稅、稅金依系統設定外加 ·
          分潤為公司基本留 65% + 業務輸入%（以利潤為基數）+ 剩餘回公司
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-[#e9e6f3] bg-white p-4">
            <div className="text-[10px] text-[#9b96b0]">{k.label}</div>
            <div className={`mt-1 text-lg font-semibold ${k.tone}`}>{k.value}</div>
            <div className="mt-0.5 text-[10px] text-[#aaa5bd]">{k.hint}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <section className="rounded-xl border border-[#e9e6f3] bg-white p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#26223d]">最近報價單</h2>
            <Link href="/sales/quotes" className="text-[11px] text-[#5538d6] no-underline">查看全部</Link>
          </div>
          {quoteRows.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#8c88a6]">尚無報價單</p>
          ) : (
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#f1eff7] text-left text-[#9b96b0]">
                  <th className="py-2 font-medium">報價單號</th>
                  <th className="py-2 font-medium">報價日期</th>
                  <th className="py-2 text-right font-medium">未稅金額</th>
                  <th className="py-2 text-right font-medium">含稅總計</th>
                </tr>
              </thead>
              <tbody>
                {quoteRows.map((q) => (
                  <tr key={q.id} className="border-b border-[#f8f7fc]">
                    <td className="py-2">
                      <Link href={`/sales/quotes/${q.id}`} className="font-medium text-[#5538d6] no-underline">
                        {q.quoteNo}
                      </Link>
                    </td>
                    <td className="py-2 text-[#57536e]">{formatDate(q.quoteDate)}</td>
                    <td className="py-2 text-right">{formatMoney(q.subtotalCents)}</td>
                    <td className="py-2 text-right font-medium text-[#5538d6]">{formatMoney(q.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="rounded-xl border border-[#e9e6f3] bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-[#26223d]">待辦與提醒</h2>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center justify-between rounded-lg bg-[#faf9ff] px-3 py-2">
              <span className="text-[#57536e]">待確認報價單</span>
              <span className="font-medium text-[#26223d]">{quoteRows.filter((q) => q.status === "draft").length}</span>
            </li>
            <li className="flex items-center justify-between rounded-lg bg-[#faf9ff] px-3 py-2">
              <span className="text-[#57536e]">逾期應收</span>
              <span className={overdueCount > 0 ? "font-medium text-[#e05a5a]" : "font-medium text-[#26223d]"}>
                {overdueCount}
              </span>
            </li>
            <li className="flex items-center justify-between rounded-lg bg-[#faf9ff] px-3 py-2">
              <span className="text-[#57536e]">未收款筆數</span>
              <span className="font-medium text-[#26223d]">{receivables.filter((r) => r.dueCents > 0).length}</span>
            </li>
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              href="/sales/quotes"
              className="rounded-lg bg-[#6d4aff] px-3 py-2 text-center text-[11px] text-white no-underline"
            >
              新增報價單
            </Link>
            <Link
              href="/purchasing/receiving"
              className="rounded-lg border border-[#e9e6f3] px-3 py-2 text-center text-[11px] text-[#57536e] no-underline"
            >
              入庫作業
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
