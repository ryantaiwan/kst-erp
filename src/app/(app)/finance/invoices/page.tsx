import { desc, eq, like } from "drizzle-orm";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { SimpleTable } from "@/components/simple-table";
import { formatDate, formatMoney } from "@/lib/utils";
import { InvoiceForm, VoidButton } from "./invoice-form";

export const instant = false;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q = "", type = "output" } = await searchParams;
  const rows = await db
    .select()
    .from(invoices)
    .where(q ? like(invoices.invoiceNo, `%${q}%`) : eq(invoices.type, type))
    .orderBy(desc(invoices.invoiceDate))
    .limit(100);

  return (
    <>
      <PageHeader
        title="發票管理"
        subtitle="顯示最近 100 筆 · 銷項 / 進項發票，金額未稅，稅金外加"
        right={
          <form className="flex gap-2">
            <select
              name="type"
              defaultValue={type}
              className="rounded-lg border border-[#e9e6f3] bg-white px-3 py-2 text-xs"
            >
              <option value="output">銷項</option>
              <option value="input">進項</option>
            </select>
            <input
              name="q"
              defaultValue={q}
              placeholder="搜尋發票號碼"
              className="rounded-lg border border-[#e9e6f3] bg-white px-3 py-2 text-xs outline-none focus:border-[#6d4aff]"
            />
            <button className="rounded-lg bg-[#6d4aff] px-3 py-2 text-xs text-white">篩選</button>
          </form>
        }
      />
      <div className="mb-5"><InvoiceForm /></div>
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
        ]}
      />
    </>
  );
}
