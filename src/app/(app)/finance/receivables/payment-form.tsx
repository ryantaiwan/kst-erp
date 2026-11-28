"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordPayment } from "./actions";
import { notifyError, notifySuccess } from "@/lib/notify";

type Invoice = { id: string; no: string; due: number };

export function PaymentForm({ invoices }: { invoices: Invoice[] }) {
  const router = useRouter();
  const [invoiceId, setInvoiceId] = useState(invoices[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (invoices.length === 0) {
    return (
      <div className="rounded-xl border border-[#e9e6f3] bg-white p-6 text-center text-sm text-[#8c88a6]">
        目前沒有未收款的銷項發票。
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#e9e6f3] bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-64 text-xs text-[#8c88a6]">
          發票
          <select
            value={invoiceId}
            onChange={(e) => {
              setInvoiceId(e.target.value);
              const inv = invoices.find((i) => i.id === e.target.value);
              setAmount(inv ? (inv.due / 100).toFixed(2) : "");
            }}
            className="mt-1 block w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d]"
          >
            {invoices.map((i) => (
              <option key={i.id} value={i.id}>
                {i.no} · 未收 NT${(i.due / 100).toLocaleString("zh-TW")}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[#8c88a6]">
          收款金額
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min="0"
            step="0.01"
            className="mt-1 block w-36 rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d]"
          />
        </label>
        <button
          onClick={() => {
            setMsg(null);
            const cents = Math.round((Number(amount) || 0) * 100);
            startTransition(async () => {
              try {
                await recordPayment(invoiceId, cents);
                setMsg("已登錄收款"); notifySuccess("已登錄收款");
                router.refresh();
              } catch (e) {
                setMsg(e instanceof Error ? e.message : "登錄失敗"); notifyError(e, "登錄失敗");
              }
            });
          }}
          disabled={pending}
          className="rounded-lg bg-[#6d4aff] px-4 py-2 text-xs text-white disabled:opacity-50"
        >
          {pending ? "登錄中…" : "登錄收款"}
        </button>
      </div>
      {msg ? <p className="mt-2 text-xs text-[#8c88a6]">{msg}</p> : null}
    </div>
  );
}
