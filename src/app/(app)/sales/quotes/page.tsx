import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { customerContacts, customers, quotes } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { SimpleTable } from "@/components/simple-table";
import { SimplePagination } from "@/components/simple-pagination";
import { formatDate, formatMoney } from "@/lib/utils";
import { currentTaxRate } from "./actions";
import { QuoteForm } from "./quote-form";
import { getCurrentScope } from "@/lib/scope";
import { eq } from "drizzle-orm";

export const instant = false;

const STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  confirmed: "已確認",
  converted: "已轉訂單",
  expired: "已過期",
};

const STATUS_TONE: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  confirmed: "bg-emerald-50 text-emerald-700",
  converted: "bg-purple-50 text-purple-700",
  expired: "bg-rose-50 text-rose-700",
};

export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const scope = await getCurrentScope();
  const where = scope.filtered ? eq(quotes.customerId, scope.scopeId!) : undefined;
  const [rows, countRows, customerRows, contactRows, taxRate] = await Promise.all([
    db.select().from(quotes).where(where)
      .orderBy(desc(quotes.createdAt)).limit(20).offset((page - 1) * 20),
    db.select({ n: sql<number>`count(*)` }).from(quotes).where(where),
    db.select({ id: customers.id, name: customers.name }).from(customers),
    db.select({ id: customerContacts.id, name: customerContacts.name, customerId: customerContacts.customerId }).from(customerContacts),
    currentTaxRate(),
  ]);

  const nameById = new Map(customerRows.map((c) => [c.id, c.name]));
  const contactNameById = new Map(contactRows.map((c) => [c.id, c.name]));

  return (
    <>
      <PageHeader
        title="報價單"
        subtitle="金額未稅、稅金依系統設定外加 · 版式參考 AUO / 能匠 報價單范本"
        right={
          <span className="rounded-lg border border-[#e9e6f3] bg-white px-3 py-2 text-xs text-[#8c88a6]">
            現行稅率 {(taxRate / 100).toFixed(0)}%（變更不回溯，舊單維持原稅率）
          </span>
        }
      />

      <QuoteForm
        customers={customerRows}
        contacts={contactRows}
        taxRateBasisPoints={taxRate}
        handler="陳孟源(Eason)"
      />

      <SimplePagination page={page} total={countRows[0]?.n ?? 0} basePath="/sales/quotes" />
      <SimpleTable
        rows={rows}
        empty="尚無報價單，請用上方表單建立"
        columns={[
          {
            key: "no",
            label: "報價單號",
            render: (r) => (
              <Link href={`/sales/quotes/${r.id}`} className="font-medium text-[#5538d6] no-underline">
                {r.quoteNo}
              </Link>
            ),
          },
          { key: "customer", label: "客戶名稱", render: (r) => nameById.get(r.customerId) ?? "—" },
          {
            key: "contact",
            label: "聯絡人",
            render: (r) => (r.contactId ? contactNameById.get(r.contactId) ?? "—" : "—"),
          },
          { key: "date", label: "報價日期", render: (r) => formatDate(r.quoteDate) },
          { key: "subtotal", label: "未稅金額", render: (r) => formatMoney(r.subtotalCents) },
          { key: "tax", label: "稅金", render: (r) => `${formatMoney(r.taxCents)}（${(r.taxRateSnapshot / 100).toFixed(0)}%）` },
          { key: "total", label: "含稅總計", render: (r) => <span className="font-medium text-[#5538d6]">{formatMoney(r.totalCents)}</span> },
          {
            key: "status",
            label: "狀態",
            render: (r) => (
              <span className={`rounded-md px-2 py-1 text-[11px] ${STATUS_TONE[r.status] ?? "bg-slate-100 text-slate-600"}`}>
                {STATUS_LABEL[r.status] ?? r.status}
              </span>
            ),
          },
        ]}
      />
    </>
  );
}
