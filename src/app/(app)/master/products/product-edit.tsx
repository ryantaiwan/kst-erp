"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EditModal } from "@/components/edit-modal";
import { notifyError, notifySuccess } from "@/lib/notify";
import { deleteProduct, updateProductById } from "@/actions/master";

type Row = {
  id: string; sku: string; name: string; spec: string | null; unit: string;
  costCents: number; salePriceCents: number; status: string;
};
const field = "mt-1 w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d] outline-none focus:border-[#6d4aff]";
const label = "text-xs text-[#8c88a6]";

export function ProductEdit({ row }: { row: Row }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-[11px] text-[#5538d6] hover:underline">編輯</button>
      {open && (
        <EditModal title={`編輯商品 ${row.sku}`} onClose={() => setOpen(false)}>
          <form action={(fd) => {
            startTransition(async () => {
              try { await updateProductById(row.id, fd); notifySuccess("已儲存"); setOpen(false); router.refresh(); }
              catch (e) { notifyError(e, "儲存失敗"); }
            });
          }} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className={label}>SKU / AU料號 *<input name="sku" required defaultValue={row.sku} className={field} /></label>
            <label className={label}>品名 *<input name="name" required defaultValue={row.name} className={field} /></label>
            <label className={`${label} sm:col-span-2`}>規格<input name="spec" defaultValue={row.spec ?? ""} className={field} /></label>
            <label className={label}>單位<select name="unit" defaultValue={row.unit} className={field}><option value="顆">顆</option><option value="件">件</option><option value="套">套</option><option value="小時">小時</option></select></label>
            <label className={label}>狀態<select name="status" defaultValue={row.status} className={field}><option value="active">啟用</option><option value="inactive">停用</option></select></label>
            <label className={label}>成本<input name="cost" type="number" step="1" defaultValue={row.costCents / 100} className={field} /></label>
            <label className={label}>售價<input name="price" type="number" step="1" defaultValue={row.salePriceCents / 100} className={field} /></label>
            <div className="flex items-end gap-2 sm:col-span-2">
              <button type="submit" disabled={pending} className="h-9 rounded-lg bg-[#6d4aff] px-4 text-xs text-white disabled:opacity-50">{pending ? "儲存中…" : "儲存"}</button>
              <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-lg border border-[#e9e6f3] px-4 text-xs text-[#57536e]">取消</button>
              <button type="button" disabled={pending} onClick={() => {
                if (!confirm(`確定刪除商品「${row.name}」？`)) return;
                startTransition(async () => { await deleteProduct(row.id); notifySuccess("已刪除"); setOpen(false); router.refresh(); });
              }} className="ml-auto h-9 rounded-lg border border-[#f0caca] px-4 text-xs text-[#e05a5a]">刪除</button>
            </div>
          </form>
        </EditModal>
      )}
    </>
  );
}
