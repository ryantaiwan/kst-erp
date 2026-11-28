"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteInvoice, updateInputInvoice } from "@/actions/transactions";
import { notifyError, notifySuccess } from "@/lib/notify";
import { formatDate, formatMoney } from "@/lib/utils";

type Row = { id: string; invoiceNo: string; invoiceDate: Date; amountCents: number; status: string; paidAt: Date | null; partyId: string | null };
const field = "mt-1 w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d] outline-none focus:border-[#6d4aff]";
const label = "text-xs text-[#8c88a6]";
const iso = (d: Date | null) => d ? d.toISOString().slice(0, 10) : "";

export function InvoiceEdit({ row }: { row: Row }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-[11px] text-[#5538d6] hover:underline">查看</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#5538d6]">進項發票 {row.invoiceNo}</h3>
              <button onClick={() => setOpen(false)} className="text-xs text-[#9b96b0]">關閉</button>
            </div>

            {!editing ? (
              <>
                <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                  <Info label="發票號碼" value={row.invoiceNo} />
                  <Info label="發票日期" value={formatDate(row.invoiceDate)} />
                  <Info label="金額" value={formatMoney(row.amountCents)} />
                  <Info label="稅金" value={formatMoney(Math.round(row.amountCents * 0.05))} />
                  <Info label="狀態" value={row.status} />
                  <Info label="付款日" value={formatDate(row.paidAt)} />
                  <Info label="交易對象 ID" value={row.partyId?.slice(0, 8) ?? "—"} />
                </dl>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => setEditing(true)} className="h-9 rounded-lg bg-[#6d4aff] px-4 text-xs text-white">編輯</button>
                  <button disabled={pending} onClick={() => {
                    if (!confirm("確定刪除這張發票？")) return;
                    startTransition(async () => { await deleteInvoice(row.id); notifySuccess("已刪除"); setOpen(false); router.refresh(); });
                  }} className="h-9 rounded-lg border border-[#f0caca] px-4 text-xs text-[#e05a5a] disabled:opacity-50">刪除</button>
                </div>
              </>
            ) : (
              <form action={(fd) => {
                startTransition(async () => {
                  try { await updateInputInvoice(fd); notifySuccess("已儲存"); setEditing(false); setOpen(false); router.refresh(); }
                  catch (e) { notifyError(e, "儲存失敗"); }
                });
              }} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input type="hidden" name="id" value={row.id} />
                <label className={label}>發票號碼<input name="invoiceNo" defaultValue={row.invoiceNo} className={field} /></label>
                <label className={label}>發票日期<input name="invoiceDate" type="date" defaultValue={iso(row.invoiceDate)} className={field} /></label>
                <label className={label}>金額<input name="amount" type="number" step="1" defaultValue={row.amountCents / 100} className={field} /></label>
                <label className={label}>狀態<select name="status" defaultValue={row.status} className={field}><option value="待付款">待付款</option><option value="已付款">已付款</option><option value="已開立">已開立</option><option value="部分付款">部分付款</option><option value="void">作廢</option></select></label>
                <label className={label}>付款日<input name="paidAt" type="date" defaultValue={iso(row.paidAt)} className={field} /></label>
                <div className="flex items-end gap-2 sm:col-span-2">
                  <button type="submit" disabled={pending} className="h-9 rounded-lg bg-[#6d4aff] px-4 text-xs text-white disabled:opacity-50">儲存</button>
                  <button type="button" onClick={() => setEditing(false)} className="h-9 rounded-lg border border-[#e9e6f3] px-4 text-xs text-[#57536e]">取消</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[#9b96b0]">{label}</dt><dd className="mt-0.5 break-words text-[#26223d]">{value}</dd></div>;
}
