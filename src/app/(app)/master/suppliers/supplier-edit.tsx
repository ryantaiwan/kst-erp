"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EditModal } from "@/components/edit-modal";
import { notifyError, notifySuccess } from "@/lib/notify";
import { deleteSupplier, updateSupplierById } from "@/actions/master";

type Row = {
  id: string; code: string | null; name: string; branchName: string | null;
  taxId: string | null; zipCode: string | null; address: string | null;
  paymentTerm: string | null; platformCode: string | null; status: string;
};
const field = "mt-1 w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d] outline-none focus:border-[#6d4aff]";
const label = "text-xs text-[#8c88a6]";

export function SupplierEdit({ row }: { row: Row }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-[11px] text-[#5538d6] hover:underline">編輯</button>
      {open && (
        <EditModal title={`編輯供應商 ${row.code ?? ""}`} onClose={() => setOpen(false)}>
          <form action={(fd) => {
            startTransition(async () => {
              try { await updateSupplierById(row.id, fd); notifySuccess("已儲存"); setOpen(false); router.refresh(); }
              catch (e) { notifyError(e, "儲存失敗"); }
            });
          }} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className={label}>代號<input name="code" defaultValue={row.code ?? ""} className={field} /></label>
            <label className={label}>公司名稱 *<input name="name" required defaultValue={row.name} className={field} /></label>
            <label className={label}>分支<input name="branchName" defaultValue={row.branchName ?? ""} className={field} /></label>
            <label className={label}>統一編號<input name="taxId" defaultValue={row.taxId ?? ""} className={field} /></label>
            <label className={label}>郵遞區號<input name="zipCode" defaultValue={row.zipCode ?? ""} className={field} /></label>
            <label className={label}>付款條件<input name="paymentTerm" defaultValue={row.paymentTerm ?? ""} className={field} /></label>
            <label className={label}>平台代號<input name="platformCode" defaultValue={row.platformCode ?? ""} className={field} /></label>
            <label className={label}>狀態<select name="status" defaultValue={row.status} className={field}><option value="active">啟用</option><option value="inactive">停用</option></select></label>
            <label className={`${label} sm:col-span-2`}>地址<input name="address" defaultValue={row.address ?? ""} className={field} /></label>
            <div className="flex items-end gap-2 sm:col-span-2">
              <button type="submit" disabled={pending} className="h-9 rounded-lg bg-[#6d4aff] px-4 text-xs text-white disabled:opacity-50">{pending ? "儲存中…" : "儲存"}</button>
              <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-lg border border-[#e9e6f3] px-4 text-xs text-[#57536e]">取消</button>
              <button type="button" disabled={pending} onClick={() => {
                if (!confirm(`確定刪除供應商「${row.name}」？`)) return;
                startTransition(async () => { await deleteSupplier(row.id); notifySuccess("已刪除"); setOpen(false); router.refresh(); });
              }} className="ml-auto h-9 rounded-lg border border-[#f0caca] px-4 text-xs text-[#e05a5a]">刪除</button>
            </div>
          </form>
        </EditModal>
      )}
    </>
  );
}
