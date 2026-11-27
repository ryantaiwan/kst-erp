"use client";
import { useState, useTransition } from "react";
import { createInvoice, voidInvoice } from "@/actions/transactions";

const field = "w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs outline-none focus:border-[#6d4aff]";

export function InvoiceForm() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");
  return (
    <div className="mb-5 rounded-xl border border-[#e9e6f3] bg-white p-4">
      <button onClick={() => setOpen(!open)} className="rounded-lg bg-[#6d4aff] px-4 py-2 text-xs font-medium text-white hover:bg-[#5a36e0]">
        {open ? "收合表單" : "＋ 新增發票"}
      </button>
      {open && (
        <form action={(fd) => { setMsg(""); startTransition(async () => { try { await createInvoice(fd); setOpen(false); } catch (e) { setMsg(e instanceof Error ? e.message : "新增失敗"); } }); }} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-[#8c88a6]">發票號碼 *<input name="invoiceNo" required className={`mt-1 ${field}`} /></label>
          <label className="text-xs text-[#8c88a6]">類型 *<select name="type" className={`mt-1 ${field}`}><option value="output">銷項</option><option value="input">進項</option></select></label>
          <label className="text-xs text-[#8c88a6]">發票日期 *<input name="invoiceDate" type="date" required className={`mt-1 ${field}`} /></label>
          <label className="text-xs text-[#8c88a6]">金額 *<input name="amount" type="number" step="1" required className={`mt-1 ${field}`} /></label>
          <label className="text-xs text-[#8c88a6]">交易對象 ID<input name="partyId" className={`mt-1 ${field}`} /></label>
          <label className="text-xs text-[#8c88a6]">狀態<select name="status" className={`mt-1 ${field}`}><option value="已開立">已開立</option><option value="未開">未開</option><option value="待付款">待付款</option></select></label>
          <label className="text-xs text-[#8c88a6]">品項說明<input name="description" className={`mt-1 ${field}`} /></label>
          <div className="flex items-end gap-2">
            <button type="submit" disabled={pending} className="rounded-lg bg-[#6d4aff] px-4 py-2 text-xs font-medium text-white disabled:opacity-50">{pending ? "儲存中…" : "儲存"}</button>
            {msg && <span className="text-xs text-[#e05a5a]">{msg}</span>}
          </div>
        </form>
      )}
    </div>
  );
}

export function VoidButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button disabled={pending} onClick={() => { if (confirm("確定作廢這張發票？")) startTransition(() => voidInvoice(id)); }} className="text-[11px] text-[#e05a5a] hover:underline disabled:opacity-50">
      作廢
    </button>
  );
}
