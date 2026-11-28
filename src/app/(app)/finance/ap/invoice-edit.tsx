"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteInvoice, updateInputInvoice } from "@/actions/transactions";
import { notifyError, notifySuccess } from "@/lib/notify";

type Row = { id: string; invoiceNo: string; invoiceDate: Date; amountCents: number; status: string; paidAt: Date | null };
const field = "w-full rounded-lg border border-[#e9e6f3] px-2 py-1 text-[11px]";
const iso = (d: Date | null) => d ? d.toISOString().slice(0, 10) : "";

export function InvoiceEdit({ row }: { row: Row }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");

  if (!open) return <button onClick={() => setOpen(true)} className="text-[11px] text-[#5538d6] hover:underline">編輯</button>;

  return (
    <div className="min-w-72">
      <form action={(fd) => {
        setMsg("");
        startTransition(async () => {
          try { await updateInputInvoice(fd); notifySuccess("已儲存"); setOpen(false); router.refresh(); }
          catch (e) { setMsg(e instanceof Error ? e.message : "失敗"); notifyError(e, "失敗"); }
        });
      }} className="space-y-2 rounded-lg bg-[#fbfaff] p-3">
        <input type="hidden" name="id" value={row.id} />
        <label className="block text-[10px] text-[#8c88a6]">發票號碼<input name="invoiceNo" defaultValue={row.invoiceNo} className={`mt-1 ${field}`} /></label>
        <label className="block text-[10px] text-[#8c88a6]">發票日期<input name="invoiceDate" type="date" defaultValue={iso(row.invoiceDate)} className={`mt-1 ${field}`} /></label>
        <label className="block text-[10px] text-[#8c88a6]">金額<input name="amount" type="number" step="1" defaultValue={row.amountCents / 100} className={`mt-1 ${field}`} /></label>
        <label className="block text-[10px] text-[#8c88a6]">狀態<select name="status" defaultValue={row.status} className={`mt-1 ${field}`}><option value="待付款">待付款</option><option value="已付款">已付款</option><option value="已開立">已開立</option></select></label>
        <label className="block text-[10px] text-[#8c88a6]">付款日<input name="paidAt" type="date" defaultValue={iso(row.paidAt)} className={`mt-1 ${field}`} /></label>
        <div className="flex items-center gap-2">
          <button type="submit" disabled={pending} className="rounded bg-[#6d4aff] px-2 py-1 text-[11px] text-white disabled:opacity-50">存</button>
          <button type="button" onClick={() => setOpen(false)} className="text-[11px] text-[#9b96b0]">取消</button>
          <button type="button" disabled={pending} onClick={() => {
            if (!confirm("確定刪除這張發票？")) return;
            startTransition(async () => { await deleteInvoice(row.id); setOpen(false); router.refresh(); });
          }} className="text-[11px] text-[#e05a5a] hover:underline">刪除</button>
          {msg && <span className="text-[10px] text-[#e05a5a]">{msg}</span>}
        </div>
      </form>
    </div>
  );
}
