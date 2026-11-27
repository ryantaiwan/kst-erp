"use client";

import { useState, useTransition } from "react";
import { settleProfit, unSettleProfit, updateSalespersonPercent } from "./actions";
import { formatMoney } from "@/lib/utils";

type Row = {
  id: string;
  sourceId: string;
  profitCents: number;
  salespersonPercent: number;
  salespersonCents: number;
  settledAt: Date | null;
};

export function SettlementForm({ rows, mode }: { rows: Row[]; mode: "settle" | "unsettle" }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const allSelected = rows.length > 0 && selected.size === rows.length;
  const totalCommission = rows
    .filter((r) => selected.has(r.id))
    .reduce((sum, r) => sum + r.salespersonCents, 0);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }

  function submit() {
    if (selected.size === 0) {
      setMessage("請先選擇紀錄");
      return;
    }
    setMessage("");
    startTransition(async () => {
      try {
        const ids = [...selected];
        if (mode === "settle") await settleProfit(ids);
        else await unSettleProfit(ids);
        setMessage(`已${mode === "settle" ? "結算" : "撤銷結算"} ${ids.length} 筆`);
        setSelected(new Set());
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "作業失敗");
      }
    });
  }

  if (rows.length === 0) {
    return (
      <div className="mb-5 rounded-xl border border-[#e9e6f3] bg-white p-6 text-center text-sm text-[#8c88a6]">
        {mode === "settle" ? "目前沒有待結算且有業務分潤的紀錄" : "目前沒有已結算的紀錄"}
      </div>
    );
  }

  return (
    <div className="mb-5 overflow-x-auto rounded-xl border border-[#e9e6f3] bg-white">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="bg-[#fbfaff] text-left text-[#9b96b0]">
            <th className="px-4 py-3">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-[#6d4aff]" />
            </th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">來源單號</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">利潤</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">業務%</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">業務分潤</th>
            {mode === "settle" && <th className="whitespace-nowrap px-4 py-3 font-medium">調整%</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-[#f1eff7] hover:bg-[#fcfbff]">
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selected.has(r.id)}
                  onChange={() => toggle(r.id)}
                  className="accent-[#6d4aff]"
                />
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-medium text-[#5538d6]">{r.sourceId}</td>
              <td className="whitespace-nowrap px-4 py-3">{formatMoney(r.profitCents)}</td>
              <td className="whitespace-nowrap px-4 py-3">{r.salespersonPercent}%</td>
              <td className="whitespace-nowrap px-4 py-3 font-medium text-[#0d8a45]">
                {formatMoney(r.salespersonCents)}
              </td>
              {mode === "settle" && (
                <td className="whitespace-nowrap px-4 py-3">
                  <PercentEditor id={r.id} current={r.salespersonPercent} disabled={pending} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f1eff7] bg-[#fbfaff] px-4 py-3">
        <div className="text-[12px] text-[#57536e]">
          已選 {selected.size} 筆 · 合計業務分潤 <span className="font-semibold text-[#5538d6]">{formatMoney(totalCommission)}</span>
          {message && <span className="ml-3 text-[#e05a5a]">{message}</span>}
        </div>
        <button
          onClick={submit}
          disabled={pending}
          className="rounded-lg bg-[#6d4aff] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#5a36e0] disabled:opacity-50"
        >
          {pending ? "處理中…" : mode === "settle" ? "標記為已結算" : "撤銷結算"}
        </button>
      </div>
    </div>
  );
}

function PercentEditor({ id, current, disabled }: { id: string; current: number; disabled: boolean }) {
  const [value, setValue] = useState(String(current));
  const [pending, startTransition] = useTransition();

  function save() {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || n > 100) return;
    startTransition(async () => {
      try {
        await updateSalespersonPercent(id, n);
      } catch {
        setValue(String(current));
      }
    });
  }

  return (
    <span className="flex items-center gap-1">
      <input
        type="number"
        min={0}
        max={100}
        step={1}
        value={value}
        disabled={disabled || pending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        className="w-16 rounded border border-[#e9e6f3] px-2 py-1 text-right text-[12px] outline-none focus:border-[#6d4aff] disabled:opacity-50"
      />
      <span className="text-[#9b96b0]">%</span>
    </span>
  );
}
