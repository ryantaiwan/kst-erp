import { and, desc, eq, gte, like, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { SimpleTable } from "@/components/simple-table";
import { RecordBrowser } from "@/components/record-browser";
import { formatDate, formatMoney } from "@/lib/utils";
import { getYearsFrom, parsePeriod, type PeriodParams } from "@/lib/period";
import { InvoiceForm, VoidButton } from "./invoice-form";
import { DetailButton } from "./detail-button";

export const instant = false;

type Params = PeriodParams & { q?: string; type?: string };

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const { q = "", type = "output" } = params;
  const { year, period, page, from, to, pageSize } = parsePeriod(params);

  const conditions = [
    q ? like(invoices.invoiceNo, `%${q}%`) : undefined,
    q ? undefined : eq(invoices.type, type),
    from ? gte(invoices.invoiceDate, from) : undefined,
    to ? lt(invoices.invoiceDate, to) : undefined,
  ].filter(Boolean);
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, countRows, years] = await Promise.all([
    db.select().from(invoices).where(where)
      .orderBy(desc(invoices.invoiceDate))
      .limit(pageSize).offset((page - 1) * pageSize),
    db.select({ n: sql<number>`count(*)` }).from(invoices).where(where),
    getYearsFrom("invoice", "invoice_date"),
  ]);

  return (
    <>
      <PageHeader
        title="發票管理"
        subtitle={`銷項 / 進項發票 · 依年度與雙月期別瀏覽 · 每頁 ${pageSize} 筆`}
        right={
          <form action="/finance/invoices" method="get" className="flex flex-wrap items-end gap-2">
            <select name="type" defaultValue={type} className="rounded-lg border border-[#e9e6f3] bg-white px-3 py-2 text-xs">
              <option value="output">銷項</option>
              <option value="input">進項</option>
            </select>
            <input name="q" defaultValue={q} placeholder="搜尋發票號碼" className="rounded-lg border border-[#e9e6f3] bg-white px-3 py-2 text-xs outline-none focus:border-[#6d4aff]" />
            {year && <input type="hidden" name="year" value={year} />}
            {period && <input type="hidden" name="period" value={period.value} />}
            <button className="h-9 rounded-lg bg-[#6d4aff] px-3 text-xs text-white">搜尋</button>
          </form>
        }
      />
      <div className="mb-5"><InvoiceForm /></div>

      <RecordBrowser
        years={years}
        params={params}
        total={countRows[0]?.n ?? 0}
        basePath="/finance/invoices"
        extraFilters={{ type: q ? undefined : type, q }}
      />

      <SimpleTable
        rows={rows}
        empty="尚無發票資料"
        columns={[
          { key: "no", label: "發票號碼", render: (r) => <span className="font-medium text-[#5538d6]">{r.invoiceNo}</span> },
          { key: "type", label: "類型", render: (r) => r.type === "output" ? "銷項" : "進項" },
          { key: "date", label: "發票日期", render: (r) => formatDate(r.invoiceDate) },
          { key: "amount", label: "金額", render: (r) => formatMoney(r.amountCents) },
          { key: "tax", label: "稅金", render: (r) => formatMoney(r.taxCents) },
          { key: "status", label: "狀態", render: (r) => r.status },
          { key: "act", label: "作業", render: (r) => r.status === "void" ? "—" : <VoidButton id={r.id} /> },
          { key: "detail", label: "內容", render: (r) => <DetailButton row={r as never} /> },
        ]}
      />
    </>
  );
}
