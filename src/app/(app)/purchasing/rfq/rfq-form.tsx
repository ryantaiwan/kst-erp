"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRfq } from "./actions";
import { notifyError, notifySuccess } from "@/lib/notify";

type Option = { id: string; name: string };
type Row = { description: string; qty: string; price: string };

const EMPTY: Row = { description: "", qty: "1", price: "" };

export function RfqForm({ suppliers }: { suppliers: Option[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([{ ...EMPTY }]);
  const [supplierId, setSupplierId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const update = (i: number, key: keyof Row, value: string) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  };

  function submit() {
    setMsg(null);
    const items = rows
      .filter((r) => r.description.trim() && Number(r.qty) > 0)
      .map((r) => ({
        description: r.description.trim(),
        qty: Number(r.qty),
        unitPriceCents: Math.round((Number(r.price) || 0) * 100),
      }));

    if (items.length === 0) return setMsg("至少需填寫一個品項");

    startTransition(async () => {
      try {
        const no = await createRfq({
          supplierId: supplierId || undefined,
          deadline: deadline || undefined,
          expectedDate: expectedDate || undefined,
          items,
        });
        setRows([{ ...EMPTY }]);
        setMsg(`已建立詢價單 ${no}`); notifySuccess(`已建立詢價單 ${no}`);
        router.refresh();
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "建立失敗"); notifyError(e, "建立失敗");
      }
    });
  }

  return (
    <div className="rounded-xl border border-[#e9e6f3] bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-[#8c88a6]">
          供應商（可稍後指定）
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d]"
          >
            <option value="">（未指定）</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[#8c88a6]">
          報價截止日
          <input
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            type="date"
            className="mt-1 block w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d]"
          />
        </label>
        <label className="text-xs text-[#8c88a6]">
          期望到貨日
          <input
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
            type="date"
            className="mt-1 block w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d]"
          />
        </label>
      </div>

      <table className="mt-4 w-full text-[12px]">
        <thead>
          <tr className="text-left text-[#9b96b0]">
            <th className="w-8 py-1 font-medium">#</th>
            <th className="py-1 font-medium">品名 / 型號</th>
            <th className="w-24 py-1 font-medium">數量</th>
            <th className="w-32 py-1 font-medium">預估單價</th>
            <th className="w-10 py-1" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="py-1 text-[#9b96b0]">{i + 1}</td>
              <td className="py-1 pr-2">
                <input
                  value={r.description}
                  onChange={(e) => update(i, "description", e.target.value)}
                  placeholder="品名 / 型號"
                  className="w-full rounded-lg border border-[#e9e6f3] px-2 py-1.5 text-xs text-[#26223d]"
                />
              </td>
              <td className="py-1 pr-2">
                <input
                  value={r.qty}
                  onChange={(e) => update(i, "qty", e.target.value)}
                  type="number"
                  min="1"
                  className="w-full rounded-lg border border-[#e9e6f3] px-2 py-1.5 text-xs text-[#26223d]"
                />
              </td>
              <td className="py-1 pr-2">
                <input
                  value={r.price}
                  onChange={(e) => update(i, "price", e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-[#e9e6f3] px-2 py-1.5 text-xs text-[#26223d]"
                />
              </td>
              <td className="py-1 text-center">
                <button
                  type="button"
                  onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                  disabled={rows.length === 1}
                  className="text-[#c3bfd4] hover:text-[#e05a5a]"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, { ...EMPTY }])}
          className="rounded-lg border border-[#e9e6f3] px-3 py-1.5 text-xs text-[#57536e] hover:bg-[#faf9ff]"
        >
          + 新增品項
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="ml-auto rounded-lg bg-[#6d4aff] px-5 py-2 text-xs text-white disabled:opacity-50"
        >
          {pending ? "儲存中…" : "建立詢價單"}
        </button>
      </div>

      {msg ? <p className="mt-2 text-xs text-[#8c88a6]">{msg}</p> : null}
    </div>
  );
}
