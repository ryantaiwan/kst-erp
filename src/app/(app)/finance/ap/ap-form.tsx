"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reconcileInputInvoice } from "./actions";

type Option = { id: string; name: string };

export function ApForm({ suppliers }: { suppliers: Option[] }) {
  const router = useRouter();
  const [invoiceNo, setInvoiceNo] = useState("");
  const [partyId, setPartyId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState("未開");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-xl border border-[#e9e6f3] bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-5">
        <label className="text-xs text-[#8c88a6]">
          發票號碼
          <input
            value={invoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
            placeholder="例 AB12345678"
            className="mt-1 block w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d]"
          />
        </label>
        <label className="text-xs text-[#8c88a6]">
          廠商
          <select
            value={partyId}
            onChange={(e) => setPartyId(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d]"
          >
            <option value="">（未指定）</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[#8c88a6]">
          金額（含稅）
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d]"
          />
        </label>
        <label className="text-xs text-[#8c88a6]">
          開立日
          <input
            value={date}
            onChange={(e) => setDate(e.target.value)}
            type="date"
            className="mt-1 block w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d]"
          />
        </label>
        <label className="text-xs text-[#8c88a6]">
          付款狀態
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d]"
          >
            {["未開", "已開立", "部分付款", "已付款", "作廢"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => {
            setMsg(null);
            const amountCents = Math.round((Number(amount) || 0) * 100);
            startTransition(async () => {
              try {
                await reconcileInputInvoice({
                  invoiceNo,
                  partyId: partyId || undefined,
                  amountCents,
                  taxCents: Math.round((amountCents * 500) / 10000),
                  invoiceDate: date,
                  status,
                });
                setInvoiceNo("");
                setAmount("");
                setMsg("已登錄進項發票");
                router.refresh();
              } catch (e) {
                setMsg(e instanceof Error ? e.message : "登錄失敗");
              }
            });
          }}
          disabled={pending}
          className="rounded-lg bg-[#6d4aff] px-5 py-2 text-xs text-white disabled:opacity-50"
        >
          {pending ? "登錄中…" : "登錄發票"}
        </button>
        <span className="text-[11px] text-[#9b96b0]">稅金依系統設定稅率（5%）自動計算</span>
      </div>

      {msg ? <p className="mt-2 text-xs text-[#8c88a6]">{msg}</p> : null}
    </div>
  );
}
