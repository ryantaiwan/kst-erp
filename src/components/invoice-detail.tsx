"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateInputInvoice, deleteInvoice } from "@/actions/transactions";
import { formatDate, formatMoney } from "@/lib/utils";

export type InvoiceRow = {
  id: string; invoiceNo: string; type: string; invoiceDate: Date;
  amountCents: number; taxCents: number; status: string; paidAt: Date | null;
  partyId: string | null; delayDays: number | null;
};

const field = "w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d] outline-none focus:border-[#6d4aff]";
const iso = (d: Date | null) => d ? d.toISOString().slice(0, 10) : "";

/** 發票詳情 / 編輯（应收與發票管理共用） */
export function InvoiceDetail({ row, onClose }: { row: InvoiceRow; onClose: () => void }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");

  return (
    <div className="rounded-xl border border-[#e0d8fa] bg-[#faf8ff] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#5538d6]">發票 {row.invoiceNo}</h3>
        <button onClick={onClose} className="text-xs text-[#9b96b0]">關閉</button>
      </div>

      {!editing ? (
        <>
          <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <Info label="類型" value={row.type === "output" ? "銷項" : "進項"} />
            <Info label="發票日期" value={formatDate(row.invoiceDate)} />
            <Info label="金額" value={formatMoney(row.amountCents)} />
            <Info label="稅金" value={formatMoney(row.taxCents)} />
            <Info label="狀態" value={row.status} />
            <Info label="付款日" value={formatDate(row.paidAt)} />
            <Info label="逾期天數" value={row.delayDays != null ? `${row.delayDays} 天` : "—"} />
            <Info label="交易對象 ID" value={row.partyId?.slice(0, 8) ?? "—"} />
          </dl>
          <div className="mt-3 flex gap-2">
            <button onClick={() => setEditing(true)} className="h-9 rounded-lg bg-[#6d4aff] px-4 text-xs text-white">編輯</button>
            <button onClick={() => {
              if (!confirm("確定刪除這張發票？")) return;
              startTransition(async () => { await deleteInvoice(row.id); onClose(); router.refresh(); });
            }} disabled={pending} className="h-9 rounded-lg border border-[#f0caca] px-4 text-xs text-[#e05a5a] disabled:opacity-50">刪除</button>
          </div>
        </>
      ) : (
        <form action={(fd) => {
          setMsg("");
          startTransition(async () => {
            try { await updateInputInvoice(fd); setEditing(false); onClose(); router.refresh(); }
            catch (e) { setMsg(e instanceof Error ? e.message : "儲存失敗"); }
          });
        }} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input type="hidden" name="id" value={row.id} />
          <label className="text-[11px] text-[#8c88a6]">發票號碼<input name="invoiceNo" defaultValue={row.invoiceNo} className={`mt-1 ${field}`} /></label>
          <label className="text-[11px] text-[#8c88a6]">發票日期<input name="invoiceDate" type="date" defaultValue={iso(row.invoiceDate)} className={`mt-1 ${field}`} /></label>
          <label className="text-[11px] text-[#8c88a6]">金額<input name="amount" type="number" step="1" defaultValue={row.amountCents / 100} className={`mt-1 ${field}`} /></label>
          <label className="text-[11px] text-[#8c88a6]">狀態<select name="status" defaultValue={row.status} className={`mt-1 ${field}`}><option value="未開">未開</option><option value="已開立">已開立</option><option value="待付款">待付款</option><option value="已付款">已付款</option><option value="部分付款">部分付款</option><option value="void">作廢</option></select></label>
          <label className="text-[11px] text-[#8c88a6]">付款日<input name="paidAt" type="date" defaultValue={iso(row.paidAt)} className={`mt-1 ${field}`} /></label>
          <div className="flex items-end gap-2 sm:col-span-3">
            <button type="submit" disabled={pending} className="h-9 rounded-lg bg-[#6d4aff] px-4 text-xs text-white disabled:opacity-50">{pending ? "儲存中…" : "儲存"}</button>
            <button type="button" onClick={() => setEditing(false)} className="h-9 rounded-lg border border-[#e9e6f3] px-4 text-xs text-[#57536e]">取消</button>
            {msg && <span className="text-[11px] text-[#e05a5a]">{msg}</span>}
          </div>
        </form>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[#9b96b0]">{label}</dt>
      <dd className="mt-0.5 text-[#26223d]">{value}</dd>
    </div>
  );
}
