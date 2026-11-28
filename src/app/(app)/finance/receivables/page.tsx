import { PageHeader } from "@/components/page-header";
import { SimpleTable } from "@/components/simple-table";
import { RecordBrowser } from "@/components/record-browser";
import { formatDate, formatMoney } from "@/lib/utils";
import { getReceivables, getReceivablesCount } from "@/lib/receivables";
import { getYearsFrom, parsePeriod, previousPeriod, type PeriodParams } from "@/lib/period";
import { PaymentForm } from "./payment-form";
import { ReminderButton } from "./reminder-button";
import { DetailButton } from "./detail-button";

export const instant = false;

export default async function ReceivablesPage({ searchParams }: { searchParams: Promise<PeriodParams> }) {
  const params = await searchParams;
  // 應收帳款預設「當年度 / 目前期別的前一期」
  const hasParams = params.year !== undefined || params.period !== undefined;
  const dflt = previousPeriod();
  const effective: PeriodParams = hasParams
    ? params
    : { ...params, year: String(dflt.year), period: String(dflt.period) };
  const { from, to, page } = parsePeriod(effective);

  // 統計與收款表單用全部資料（不受期間篩選影響），明細表才分頁
  const [allRows, rows, total, years] = await Promise.all([
    getReceivables(),
    getReceivables({ from, to, page }),
    getReceivablesCount({ from, to }),
    getYearsFrom("invoice", "invoice_date"),
  ]);

  const outstanding = allRows.filter((r) => r.dueCents > 0);
  const overdue = outstanding.filter((r) => r.overdue);
  const totalDue = outstanding.reduce((s, r) => s + r.dueCents, 0);
  const totalOverdue = overdue.reduce((s, r) => s + r.dueCents, 0);

  return (
    <>
      <PageHeader
        title="應收帳款"
        subtitle="銷項發票未收款金額 · 逾期定義為距開立日超過 30 天 · 依年度與雙月期別瀏覽"
        right={
          <div className="flex flex-wrap gap-2">
            <Stat label="未收款筆數" value={`${outstanding.length}`} tone="text-[#26223d]" />
            <Stat label="未收款總額" value={formatMoney(totalDue)} tone="text-[#5538d6]" />
            <Stat label="逾期金額" value={formatMoney(totalOverdue)} tone="text-[#e05a5a]" />
          </div>
        }
      />

      <PaymentForm invoices={outstanding.map((r) => ({ id: r.invoice.id, no: r.invoice.invoiceNo, due: r.dueCents }))} />

      <div className="mb-3 mt-6 text-sm font-semibold text-[#26223d]">應收明細</div>
      <RecordBrowser years={years} params={effective} total={total} basePath="/finance/receivables" />

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
              ) : "—"
            ),
          },
          { key: "status", label: "狀態", render: (r) => r.invoice.status },
          { key: "remind", label: "提醒", render: (r) => r.dueCents > 0 ? <ReminderButton invoiceId={r.invoice.id} no={r.invoice.invoiceNo} /> : "—" },
          { key: "detail", label: "內容", render: (r) => <DetailButton row={r.invoice as never} /> },
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
