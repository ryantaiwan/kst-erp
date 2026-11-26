"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createQuote } from "@/app/(app)/sales/quotes/actions";

type Option = { id: string; name: string };
type ContactOption = Option & { customerId: string };

type Row = {
  description: string;
  qty: string;
  unit: string;
  price: string;
};

const EMPTY: Row = { description: "", qty: "1", unit: "顆", price: "" };

export function QuoteForm({
  customers,
  contacts,
  taxRateBasisPoints,
  handler,
}: {
  customers: Option[];
  contacts: ContactOption[];
  taxRateBasisPoints: number;
  handler: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([{ ...EMPTY }]);
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [contactId, setContactId] = useState("");
  const [note, setNote] = useState("");
  const [validDays, setValidDays] = useState("30");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filteredContacts = contacts.filter((c) => c.customerId === customerId);

  const subtotal = rows.reduce((sum, r) => {
    const q = Number(r.qty) || 0;
    const p = Number(r.price) || 0;
    return sum + q * p;
  }, 0);
  const tax = Math.round((subtotal * taxRateBasisPoints) / 10000);

  const update = (i: number, key: keyof Row, value: string) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  };

  function submit() {
    setError(null);
    const items = rows
      .filter((r) => r.description.trim() && Number(r.qty) > 0)
      .map((r) => ({
        description: r.description.trim(),
        qty: Number(r.qty),
        unit: r.unit || "顆",
        priceCents: Math.round((Number(r.price) || 0) * 100),
      }));

    if (!customerId) return setError("請選擇客戶");
    if (items.length === 0) return setError("至少需填寫一個品項（品名、數量、單價）");

    startTransition(async () => {
      try {
        const no = await createQuote({
          customerId,
          contactId: contactId || undefined,
          handler,
          note: note || undefined,
          validDays: Number(validDays) || 30,
          items,
        });
        setRows([{ ...EMPTY }]);
        setNote("");
        router.push(`/sales/quotes?q=${encodeURIComponent(no)}`);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "新增失敗");
      }
    });
  }

  return (
    <div className="mb-6 rounded-xl border border-[#e9e6f3] bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="text-xs text-[#8c88a6]">
          客戶
          <select
            value={customerId}
            onChange={(e) => {
              setCustomerId(e.target.value);
              setContactId("");
            }}
            className="mt-1 block w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d]"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[#8c88a6]">
          聯絡人
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d]"
          >
            <option value="">（未指定）</option>
            {filteredContacts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[#8c88a6]">
          有效天數
          <input
            value={validDays}
            onChange={(e) => setValidDays(e.target.value)}
            type="number"
            min="1"
            className="mt-1 block w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d]"
          />
        </label>
        <label className="text-xs text-[#8c88a6]">
          稅率（系統設定）
          <input
            readOnly
            value={`${(taxRateBasisPoints / 100).toFixed(0)}%`}
            className="mt-1 block w-full rounded-lg border border-[#efeef5] bg-[#faf9ff] px-3 py-2 text-xs text-[#8c88a6]"
          />
        </label>
      </div>

      <table className="mt-4 w-full text-[12px]">
        <thead>
          <tr className="text-left text-[#9b96b0]">
            <th className="w-8 py-1 font-medium">#</th>
            <th className="py-1 font-medium">品名 / 型號 / 規格 / 說明</th>
            <th className="w-24 py-1 font-medium">數量</th>
            <th className="w-20 py-1 font-medium">單位</th>
            <th className="w-32 py-1 font-medium">單價</th>
            <th className="w-28 py-1 font-medium">小計</th>
            <th className="w-10 py-1" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="py-1 text-[#9b96b0]">{i + 1}</td>
              <td className="py-1 pr-2">
                <textarea
                  value={r.description}
                  onChange={(e) => update(i, "description", e.target.value)}
                  rows={1}
                  placeholder="例：HITECH-PWS 系列人機介面&#10;Model: PWS6A00T-P"
                  className="w-full resize-y rounded-lg border border-[#e9e6f3] px-2 py-1.5 text-xs text-[#26223d]"
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
                  value={r.unit}
                  onChange={(e) => update(i, "unit", e.target.value)}
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
                  placeholder="未稅單價"
                  className="w-full rounded-lg border border-[#e9e6f3] px-2 py-1.5 text-xs text-[#26223d]"
                />
              </td>
              <td className="py-1 pr-2 text-[#57536e]">
                {((Number(r.qty) || 0) * (Number(r.price) || 0)).toLocaleString("zh-TW", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td className="py-1 text-center">
                <button
                  type="button"
                  onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-[#c3bfd4] hover:text-[#e05a5a]"
                  disabled={rows.length === 1}
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
        <div className="ml-auto flex items-center gap-4 text-xs">
          <span className="text-[#8c88a6]">未稅小計</span>
          <span className="font-medium text-[#26223d]">
            {subtotal.toLocaleString("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[#8c88a6]">稅金</span>
          <span className="font-medium text-[#26223d]">
            {tax.toLocaleString("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[#8c88a6]">含稅</span>
          <span className="font-semibold text-[#5538d6]">
            {(subtotal + tax).toLocaleString("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <label className="mt-3 block text-xs text-[#8c88a6]">
        備註（每行一條，留空則套用系統預設）
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d]"
        />
      </label>

      {error ? <p className="mt-2 text-xs text-[#e05a5a]">{error}</p> : null}

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="rounded-lg bg-[#6d4aff] px-5 py-2 text-xs text-white disabled:opacity-50"
        >
          {pending ? "儲存中…" : "建立報價單"}
        </button>
      </div>
    </div>
  );
}
