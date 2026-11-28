import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { SimpleTable } from "@/components/simple-table";
import { RecordBrowser } from "@/components/record-browser";
import { formatDate, formatMoney } from "@/lib/utils";
import { getYearsFrom, parsePeriod, type PeriodParams } from "@/lib/period";
import { getInputInvoices } from "./actions";
import { ApForm } from "./ap-form";
import { InvoiceEdit } from "./invoice-edit";

export const instant = false;

export default async function ApPage({ searchParams }: { searchParams: Promise<PeriodParams> }) {
  const params = await searchParams;
  const { from, to, page } = parsePeriod(params);
  const [data, supplierRows, years] = await Promise.all([
    getInputInvoices({ from, to, page }),
    db.select({ id: suppliers.id, name: suppliers.name }).from(suppliers),
    getYearsFrom("invoice", "invoice_date"),
  ]);

  return (
    <>
      <PageHeader
        title="進項發票對帳"
        subtitle="進項發票登錄與付款狀態核對 · 依年度與雙月期別瀏覽 · 每頁 20 筆"
        right={
          <div className="flex flex-wrap gap-2">
            <Stat label="進項總額" value={formatMoney(data.totalCents)} tone="text-[#26223d]" />
            <Stat label="已付款" value={formatMoney(data.paidCents)} tone="text-[#06c755]" />
            <Stat label="未付款" value={formatMoney(data.unpaidCents)} tone="text-[#e05a5a]" />
          </div>
        }
      />

      <ApForm suppliers={supplierRows} />

      <RecordBrowser years={years} params={params} total={data.total} basePath="/finance/ap" />

      <div className="mb-3 text-sm font-semibold text-[#26223d]">進項發票明細</div>
      <SimpleTable
        rows={data.rows}
        empty="尚無進項發票"
        columns={[
          { key: "no", label: "發票號碼", render: (r) => <span className="font-medium text-[#5538d6]">{r.invoice.invoiceNo}</span> },
          { key: "party", label: "廠商", render: (r) => r.partyName },
          { key: "date", label: "開立日", render: (r) => formatDate(r.invoice.invoiceDate) },
          { key: "amount", label: "金額", render: (r) => formatMoney(r.invoice.amountCents) },
          { key: "tax", label: "稅金", render: (r) => formatMoney(r.invoice.taxCents) },
          { key: "status", label: "狀態", render: (r) => r.invoice.status },
          { key: "paidAt", label: "付款日", render: (r) => formatDate(r.invoice.paidAt) },
          { key: "edit", label: "作業", render: (r) => <InvoiceEdit row={r.invoice} /> },
        ]}
      />
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border border-[#e9e6f3] bg-white px-3 py-2">
      <div className="text-[10px] text-[#9b96b0]">{label}</div>
      <div className={`text-sm font-semibold ${tone}`}>{value}</div>
    </div>
  );
}
