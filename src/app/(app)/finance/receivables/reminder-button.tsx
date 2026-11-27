"use client";
import { useState, useTransition } from "react";
import { sendReminder } from "@/actions/transactions";

export function ReminderButton({ invoiceId, no }: { invoiceId: string; no: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");

  if (!open) return <button onClick={() => setOpen(true)} className="text-[11px] text-[#5538d6] hover:underline">提醒</button>;

  return (
    <span className="flex items-center gap-1">
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@email.com" className="w-40 rounded border border-[#e9e6f3] px-2 py-1 text-[11px]" />
      <button disabled={pending} onClick={() => { setMsg(""); startTransition(async () => { try { await sendReminder(invoiceId, email); setMsg("已寄出"); setOpen(false); } catch (e) { setMsg(e instanceof Error ? e.message : "失敗"); } }); }} className="rounded bg-[#6d4aff] px-2 py-1 text-[11px] text-white disabled:opacity-50">寄</button>
      {msg && <span className="text-[10px] text-[#e05a5a]">{msg}</span>}
    </span>
  );
}
