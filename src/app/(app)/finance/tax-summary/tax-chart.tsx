"use client";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Row = { month: string; outputAmount: number; inputAmount: number };

export function TaxChart({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return null;
  const data = rows.map((r) => ({
    month: r.month,
    "銷項": Math.round(r.outputAmount / 100),
    "進項": Math.round(r.inputAmount / 100),
  }));
  return (
    <div className="h-64 w-full rounded-xl border border-[#e9e6f3] bg-white p-4">
      <div className="mb-2 text-sm font-semibold text-[#26223d]">銷項 / 進項金額趨勢（元）</div>
      <ResponsiveContainer width="100%" height="88%">
        <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1eff7" />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9b96b0" }} />
          <YAxis tick={{ fontSize: 10, fill: "#9b96b0" }} />
          <Tooltip formatter={(v) => Number(v ?? 0).toLocaleString("zh-TW")} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="銷項" fill="#6d4aff" />
          <Bar dataKey="進項" fill="#06c755" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
