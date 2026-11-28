"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import type { DailyTaxRow } from "@/lib/tax-summary";

type YearGroup = { year: string; months: { month: string; days: DailyTaxRow[] }[] };

// 銷項紫、進項綠，與全站顏色語彙一致
const OUTPUT = { text: "text-[#6d4aff]", bg: "bg-[#f3f0fc]", dot: "bg-[#6d4aff]" };
const INPUT = { text: "text-[#0a9e50]", bg: "bg-[#eefaf3]", dot: "bg-[#0a9e50]" };

function buildTree(rows: DailyTaxRow[]): YearGroup[] {
  const years = new Map<string, Map<string, DailyTaxRow[]>>();
  for (const r of rows) {
    const [y, m] = r.date.split("-");
    const months = years.get(y) ?? new Map<string, DailyTaxRow[]>();
    const days = months.get(m) ?? [];
    days.push(r);
    months.set(m, days);
    years.set(y, months);
  }
  return [...years.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, months]) => ({
      year,
      months: [...months.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([month, days]) => ({ month, days })),
    }));
}

function sum(days: DailyTaxRow[], key: "outputCount" | "inputCount" | "outputAmountCents" | "inputAmountCents") {
  return days.reduce((s, d) => s + d[key], 0);
}

/** 銷項 / 進項並列的總計標示 */
function TypeTotals({ days, compact = false }: { days: DailyTaxRow[]; compact?: boolean }) {
  return (
    <span className={`grid grid-cols-2 gap-x-4 text-right tabular-nums ${compact ? "text-[10px]" : "text-[11px]"} sm:flex sm:gap-5`}>
      <span className={`flex items-center justify-end gap-1.5 ${OUTPUT.text}`}>
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${OUTPUT.dot}`} />
        <span>銷項 {sum(days, "outputCount")} 筆 / {formatMoney(sum(days, "outputAmountCents"))}</span>
      </span>
      <span className={`flex items-center justify-end gap-1.5 ${INPUT.text}`}>
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${INPUT.dot}`} />
        <span>進項 {sum(days, "inputCount")} 筆 / {formatMoney(sum(days, "inputAmountCents"))}</span>
      </span>
    </span>
  );
}

export function TaxTree({ rows }: { rows: DailyTaxRow[] }) {
  const tree = buildTree(rows);
  const [openYears, setOpenYears] = useState<Set<string>>(new Set(tree.slice(0, 1).map((g) => g.year)));
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set());

  const toggle = (set: Set<string>, setFn: (s: Set<string>) => void, key: string) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key); else next.add(key);
    setFn(next);
  };

  if (tree.length === 0) {
    return <div className="rounded-xl border border-[#e9e6f3] bg-white p-8 text-center text-sm text-[#9b96b0]">無資料</div>;
  }

  return (
    <div className="space-y-3">
      {/* 圖例 */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[#e9e6f3] bg-white px-4 py-2 text-[11px]">
        <span className="text-[#9b96b0]">顏色標示：</span>
        <span className={`flex items-center gap-1.5 font-medium ${OUTPUT.text}`}><span className={`h-2 w-2 rounded-full ${OUTPUT.dot}`} />銷項發票</span>
        <span className={`flex items-center gap-1.5 font-medium ${INPUT.text}`}><span className={`h-2 w-2 rounded-full ${INPUT.dot}`} />進項發票</span>
      </div>

      {tree.map((yg) => {
        const yDays = yg.months.flatMap((m) => m.days);
        const yOpen = openYears.has(yg.year);
        return (
          <section key={yg.year} className="overflow-hidden rounded-xl border border-[#e9e6f3] bg-white">
            <button
              onClick={() => toggle(openYears, setOpenYears, yg.year)}
              className="flex w-full flex-wrap items-center justify-between gap-2 bg-[#fbfaff] px-4 py-3 text-left hover:bg-[#f5f2ff]"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-[#5538d6]">
                {yOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                {yg.year} 年
              </span>
              <TypeTotals days={yDays} />
            </button>

            {yOpen && (
              <div className="space-y-2 p-3">
                {yg.months.map((mg) => {
                  const key = `${yg.year}-${mg.month}`;
                  const mOpen = openMonths.has(key);
                  const mDays = mg.days;
                  return (
                    <div key={key} className="overflow-hidden rounded-lg border border-[#f1eff7]">
                      <button
                        onClick={() => toggle(openMonths, setOpenMonths, key)}
                        className="flex w-full flex-wrap items-center justify-between gap-2 px-3 py-2 text-left hover:bg-[#fcfbff]"
                      >
                        <span className="flex items-center gap-2 text-xs font-medium text-[#26223d]">
                          {mOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          {Number(mg.month)} 月
                        </span>
                        <TypeTotals days={mDays} compact />
                      </button>

                      {mOpen && (
                        <div className="overflow-x-auto border-t border-[#f1eff7]">
                          <table className="w-full min-w-max text-[11px]">
                            <thead>
                              <tr>
                                <th className="px-3 py-2 text-left font-medium text-[#9b96b0]">日期</th>
                                <th colSpan={2} className={`border-b-2 px-3 py-2 text-center font-semibold ${OUTPUT.text} ${OUTPUT.bg}`}>
                                  銷項發票
                                </th>
                                <th colSpan={2} className={`border-b-2 px-3 py-2 text-center font-semibold ${INPUT.text} ${INPUT.bg}`}>
                                  進項發票
                                </th>
                              </tr>
                              <tr className="bg-[#fcfbff] text-[#9b96b0]">
                                <th className="px-3 py-1.5" />
                                <th className={`px-3 py-1.5 text-right font-medium ${OUTPUT.text}`}>筆數</th>
                                <th className={`px-3 py-1.5 text-right font-medium ${OUTPUT.text}`}>金額</th>
                                <th className={`px-3 py-1.5 text-right font-medium ${INPUT.text}`}>筆數</th>
                                <th className={`px-3 py-1.5 text-right font-medium ${INPUT.text}`}>金額</th>
                              </tr>
                            </thead>
                            <tbody>
                              {mg.days.map((d) => (
                                <tr key={d.date} className="border-t border-[#f8f7fc] hover:bg-[#fcfbff]">
                                  <td className="px-3 py-2 font-medium text-[#57536e]">{d.date}</td>
                                  <td className={`px-3 py-2 text-right tabular-nums ${d.outputCount ? OUTPUT.text : "text-[#d3d0df]"}`}>
                                    {d.outputCount || "—"}
                                  </td>
                                  <td className={`px-3 py-2 text-right tabular-nums ${d.outputAmountCents ? OUTPUT.text : "text-[#d3d0df]"}`}>
                                    {d.outputAmountCents ? formatMoney(d.outputAmountCents) : "—"}
                                  </td>
                                  <td className={`px-3 py-2 text-right tabular-nums ${d.inputCount ? INPUT.text : "text-[#d3d0df]"}`}>
                                    {d.inputCount || "—"}
                                  </td>
                                  <td className={`px-3 py-2 text-right tabular-nums ${d.inputAmountCents ? INPUT.text : "text-[#d3d0df]"}`}>
                                    {d.inputAmountCents ? formatMoney(d.inputAmountCents) : "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
