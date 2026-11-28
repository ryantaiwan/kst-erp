"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import type { DailyTaxRow } from "@/lib/tax-summary";

type YearGroup = { year: string; months: { month: string; days: DailyTaxRow[] }[] };

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

export function TaxTree({ rows }: { rows: DailyTaxRow[] }) {
  const tree = buildTree(rows);
  const [openYears, setOpenYears] = useState<Set<string>>(new Set(tree.slice(0, 1).map((g) => g.year)));
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set());

  const toggle = (set: Set<string>, setFn: (s: Set<string>) => void, key: string) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key); else next.add(key);
    setFn(next);
  };

  if (tree.length === 0) return <div className="rounded-xl border border-[#e9e6f3] bg-white p-8 text-center text-sm text-[#9b96b0]">無資料</div>;

  return (
    <div className="space-y-3">
      {tree.map((yg) => {
        const yDays = yg.months.flatMap((m) => m.days);
        const yOpen = openYears.has(yg.year);
        return (
          <section key={yg.year} className="overflow-hidden rounded-xl border border-[#e9e6f3] bg-white">
            <button
              onClick={() => toggle(openYears, setOpenYears, yg.year)}
              className="flex w-full items-center justify-between gap-2 bg-[#fbfaff] px-4 py-3 text-left hover:bg-[#f5f2ff]"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-[#5538d6]">
                {yOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                {yg.year} 年
              </span>
              <span className="flex flex-wrap gap-3 text-[11px] text-[#8c88a6]">
                <span>銷項 {sum(yDays, "outputCount")} 筆 / {formatMoney(sum(yDays, "outputAmountCents"))}</span>
                <span>進項 {sum(yDays, "inputCount")} 筆 / {formatMoney(sum(yDays, "inputAmountCents"))}</span>
              </span>
            </button>

            {yOpen && (
              <div className="space-y-2 p-3">
                {yg.months.map((mg) => {
                  const key = `${yg.year}-${mg.month}`;
                  const mOpen = openMonths.has(key);
                  return (
                    <div key={key} className="rounded-lg border border-[#f1eff7]">
                      <button
                        onClick={() => toggle(openMonths, setOpenMonths, key)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-[#fcfbff]"
                      >
                        <span className="flex items-center gap-2 text-xs font-medium text-[#26223d]">
                          {mOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          {Number(mg.month)} 月
                        </span>
                        <span className="flex flex-wrap gap-3 text-[11px] text-[#8c88a6]">
                          <span>銷項 {sum(mg.days, "outputCount")} 筆 / {formatMoney(sum(mg.days, "outputAmountCents"))}</span>
                          <span>進項 {sum(mg.days, "inputCount")} 筆 / {formatMoney(sum(mg.days, "inputAmountCents"))}</span>
                        </span>
                      </button>
                      {mOpen && (
                        <div className="overflow-x-auto border-t border-[#f1eff7]">
                          <table className="w-full min-w-max text-[11px]">
                            <thead className="bg-[#fcfbff] text-[#9b96b0]">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium">日期</th>
                                <th className="px-3 py-2 text-right font-medium">銷項筆數</th>
                                <th className="px-3 py-2 text-right font-medium">銷項金額</th>
                                <th className="px-3 py-2 text-right font-medium">進項筆數</th>
                                <th className="px-3 py-2 text-right font-medium">進項金額</th>
                              </tr>
                            </thead>
                            <tbody>
                              {mg.days.map((d) => (
                                <tr key={d.date} className="border-t border-[#f8f7fc]">
                                  <td className="px-3 py-2 text-[#5538d6]">{d.date}</td>
                                  <td className="px-3 py-2 text-right">{d.outputCount}</td>
                                  <td className="px-3 py-2 text-right">{formatMoney(d.outputAmountCents)}</td>
                                  <td className="px-3 py-2 text-right">{d.inputCount}</td>
                                  <td className="px-3 py-2 text-right">{formatMoney(d.inputAmountCents)}</td>
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
