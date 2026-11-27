import { PageHeader } from "@/components/page-header";
import { SimpleTable } from "@/components/simple-table";
import { formatDate, formatMoney } from "@/lib/utils";
import { getReceivables } from "@/lib/receivables";
import { PaymentForm } from "./payment-form";
import { ReminderButton } from "./reminder-button";

export const instant = false;

export default async function ReceivablesPage() {
  const rows = await getReceivables();
  const outstanding = rows.filter((r) => r.dueCents > 0);
  const overdue = outstanding.filter((r) => r.overdue);
  const totalDue = outstanding.reduce((s, r) => s + r.dueCents, 0);
  const totalOverdue = overdue.reduce((s, r) => s + r.dueCents, 0);

  return (
    <>
      <PageHeader
        title="應收帳款"
        subtitle="銷項發票未收款金額 · 逾期定義為距開立日超過 30 天"
        right={
          <div className="flex gap-2">
            <Stat label="未收款筆數" value={`${outstanding.length}`} tone="text-[#26223d]" />
            <Stat label="未收款總額" value={formatMoney(totalDue)} tone="text-[#5538d6]" />
            <Stat label="逾期金額" value={formatMoney(totalOverdue)} tone="text-[#e05a5a]" />
          </div>
        }
      />

      <PaymentForm invoices={outstanding.map((r) => ({ id: r.invoice.id, no: r.invoice.invoiceNo, due: r.dueCents }))} />

      <div className="mb-3 mt-6 text-sm font-semibold text-[#26223d]">應收明細</div>
      <SimpleTable
        rows={rows}
        empty="尚無銷項發票"
        columns={[
          { key: "no", label: "發票號碼", render: (r) => <span className="font-medium text-[#5538d6]">{r.invoice.invoiceNo}</span> },
          { key: "party", label: "客戶", render: (r) => r.partyName },
          { key: "date", label: "開立日", render: (r) => formatDate(r.invoice.invoiceDate) },
          { key: "amount", label: "發票金額", render: (r) => formatMoney(r.invoice.amountCents) },
          { key: "paid", label: "已收款", render: (r) => formatMoney(r.paidCents) },
          {
            key: "due",
            label: "未收款",
            render: (r) => (
              <span className={r.dueCents > 0 ? "font-medium text-[#e05a5a]" : "text-[#9b96b0]"}>
                {formatMoney(r.dueCents)}
              </span>
            ),
          },
          {
            key: "delay",
            label: "逾期天數",
            render: (r) => (
              r.dueCents > 0 ? (
                <span className={r.overdue ? "font-medium text-[#e05a5a]" : "text-[#57536e]"}>{r.delayDays} 天</span>
              ) : (
                "—"
              )
            ),
          },
          { key: "status", label: "狀態", render: (r) => r.invoice.status },
          { key: "remind", label: "提醒", render: (r) => r.dueCents > 0 ? <ReminderButton invoiceId={r.invoice.id} no={r.invoice.invoiceNo} /> : "—" },
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
