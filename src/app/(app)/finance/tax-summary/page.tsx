import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { formatMoney } from "@/lib/utils";
import { getDailyTax, getInvoiceDateRange, getMonthlyTax, getTaxSummary, type TaxSummaryRow } from "@/lib/tax-summary";
import { TaxChart } from "./tax-chart";
import { TaxTree } from "./tax-tree";

export const instant = false;

export default async function TaxSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const params = { from, to };
  const [summary, monthly, daily, range] = await Promise.all([
    getTaxSummary(params),
    getMonthlyTax(params),
    getDailyTax(params),
    getInvoiceDateRange(),
  ]);

  const total = (type: string) =>
    summary
      .filter((r) => r.type === type && !isVoid(r.status))
      .reduce(
        (acc, r) => ({ count: acc.count + r.count, amount: acc.amount + r.amountCents, tax: acc.tax + r.taxCents }),
        { count: 0, amount: 0, tax: 0 },
      );

  const output = total("output");
  const input = total("input");
  const netAmount = output.amount - input.amount;
  const netTax = output.tax - input.tax;
  const estimatedOutputTax = Math.round(output.amount * 0.05);
  const estimatedInputTax = Math.round(input.amount * 0.05);

  return (
    <>
      <PageHeader
        title="稅務彙總報表"
        subtitle="依期間統計銷項 / 進項發票 · 已作廢單據不計入 · 金額含稅"
        right={
          <div className="flex gap-2">
            <Stat label="銷項筆數" value={`${output.count}`} tone="text-[#26223d]" />
            <Stat label="進項筆數" value={`${input.count}`} tone="text-[#26223d]" />
            <Stat label="銷項-進項差額" value={formatMoney(netAmount)} tone="text-[#5538d6]" />
          </div>
        }
      />

      <div className="mb-5 rounded-xl border border-[#e9e6f3] bg-white p-4">
        <form action="/finance/tax-summary" method="get" className="flex flex-wrap items-end gap-3">
          <label className="text-[12px]">
            <span className="mb-1 block text-[#9b96b0]">起始日期</span>
            <input
              type="date"
              name="from"
              defaultValue={from ?? range.min}
              className="rounded-lg border border-[#e9e6f3] px-3 py-2 text-[12px] outline-none focus:border-[#6d4aff]"
            />
          </label>
          <label className="text-[12px]">
            <span className="mb-1 block text-[#9b96b0]">結束日期（不含）</span>
            <input
              type="date"
              name="to"
              defaultValue={to ?? ""}
              className="rounded-lg border border-[#e9e6f3] px-3 py-2 text-[12px] outline-none focus:border-[#6d4aff]"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-[#6d4aff] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#5a36e0]"
          >
            套用
          </button>
          <Link
            href="/finance/tax-summary"
            className="rounded-lg border border-[#e9e6f3] px-4 py-2 text-[12px] text-[#57536e] hover:bg-[#fbfaff]"
          >
            清除
          </Link>
          <span className="ml-auto text-[11px] text-[#9b96b0]">資料範圍：{range.min} ~ {range.max}</span>
        </form>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <SummaryCard
          title="銷項發票（已開立）"
          amount={output.amount}
          tax={output.tax}
          estimatedTax={estimatedOutputTax}
          count={output.count}
        />
        <SummaryCard
          title="進項發票（待付款）"
          amount={input.amount}
          tax={input.tax}
          estimatedTax={estimatedInputTax}
          count={input.count}
        />
      </div>

      <div className="mb-3 rounded-xl border border-[#e9e6f3] bg-white p-4">
        <div className="mb-3 text-sm font-semibold text-[#26223d]">稅額摘要</div>
        <div className="grid grid-cols-1 gap-4 text-[12px] sm:grid-cols-2 lg:grid-cols-4">
          <KV label="已紀錄銷項稅額" value={formatMoney(output.tax)} />
          <KV label="已紀錄進項稅額" value={formatMoney(input.tax)} />
          <KV label="推估銷項稅額 (5%)" value={formatMoney(estimatedOutputTax)} />
          <KV label="推估進項稅額 (5%)" value={formatMoney(estimatedInputTax)} />
          <KV label="已紀錄稅額差額" value={formatMoney(netTax)} />
          <KV label="推估稅額差額" value={formatMoney(estimatedOutputTax - estimatedInputTax)} />
        </div>
        <p className="mt-3 text-[11px] leading-5 text-[#9b96b0]">
          註：歷史匯入資料的稅額欄位多為 0（稅額內含於發票金額），「推估」以含稅金額 × 5% 計算，僅供參考；
          實際申報請依發票上記載稅額為準。
        </p>
      </div>

      <div className="mb-3 text-sm font-semibold text-[#26223d]">依狀態統計</div>
      <div className="mb-6 overflow-x-auto rounded-xl border border-[#e9e6f3] bg-white">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-[#fbfaff] text-left text-[#9b96b0]">
              <th className="px-4 py-3 font-medium">類型</th>
              <th className="px-4 py-3 font-medium">狀態</th>
              <th className="px-4 py-3 text-right font-medium">筆數</th>
              <th className="px-4 py-3 text-right font-medium">金額</th>
              <th className="px-4 py-3 text-right font-medium">已紀錄稅額</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((r: TaxSummaryRow) => (
              <tr key={`${r.type}-${r.status}`} className="border-t border-[#f1eff7]">
                <td className="px-4 py-3">{r.type === "output" ? "銷項" : "進項"}</td>
                <td className="px-4 py-3">{r.status}</td>
                <td className="px-4 py-3 text-right">{r.count}</td>
                <td className="px-4 py-3 text-right">{formatMoney(r.amountCents)}</td>
                <td className="px-4 py-3 text-right">{formatMoney(r.taxCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-3 mt-6"><TaxChart rows={monthly.slice(-24).map((m) => ({ month: m.month, outputAmount: m.outputAmountCents, inputAmount: m.inputAmountCents }))} /></div>
      <div className="mb-3 mt-6 text-sm font-semibold text-[#26223d]">年 / 月 / 日 明細（點年度與月份展開）</div>
      <TaxTree rows={daily} />
    </>
  );
}

function isVoid(status: string) {
  return status === "void" || status === "作廢";
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border border-[#e9e6f3] bg-white px-3 py-2">
      <div className="text-[10px] text-[#9b96b0]">{label}</div>
      <div className={`text-sm font-semibold ${tone}`}>{value}</div>
    </div>
  );
}

function SummaryCard({
  title,
  amount,
  tax,
  estimatedTax,
  count,
}: {
  title: string;
  amount: number;
  tax: number;
  estimatedTax: number;
  count: number;
}) {
  return (
    <div className="rounded-xl border border-[#e9e6f3] bg-white p-4">
      <div className="mb-2 text-[12px] font-semibold text-[#26223d]">{title}</div>
      <div className="text-xl font-semibold text-[#5538d6]">{formatMoney(amount)}</div>
      <div className="mt-2 flex gap-4 text-[11px] text-[#9b96b0]">
        <span>{count} 筆</span>
        <span>已紀錄稅額 {formatMoney(tax)}</span>
        <span>推估稅額 {formatMoney(estimatedTax)}</span>
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[#9b96b0]">{label}</div>
      <div className="mt-1 font-semibold text-[#26223d]">{value}</div>
    </div>
  );
}
