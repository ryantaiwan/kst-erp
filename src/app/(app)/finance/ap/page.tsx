import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { SimpleTable } from "@/components/simple-table";
import { formatDate, formatMoney } from "@/lib/utils";
import { getInputInvoices } from "./actions";
import { ApForm } from "./ap-form";

export const instant = false;

export default async function ApPage() {
  const data = await getInputInvoices();
  const supplierRows = await db.select({ id: suppliers.id, name: suppliers.name }).from(suppliers);

  return (
    <>
      <PageHeader
        title="進項發票對帳"
        subtitle="進項發票登錄與付款狀態核對 · 稅率依系統設定"
        right={
          <div className="flex gap-2">
            <Stat label="進項總額" value={formatMoney(data.totalCents)} tone="text-[#26223d]" />
            <Stat label="已付款" value={formatMoney(data.paidCents)} tone="text-[#06c755]" />
            <Stat label="未付款" value={formatMoney(data.unpaidCents)} tone="text-[#e05a5a]" />
          </div>
        }
      />

      <ApForm suppliers={supplierRows} />

      <div className="mb-3 mt-6 text-sm font-semibold text-[#26223d]">進項發票明細</div>
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
          {
            key: "paidAt",
            label: "付款日",
            render: (r) => formatDate(r.invoice.paidAt),
          },
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
