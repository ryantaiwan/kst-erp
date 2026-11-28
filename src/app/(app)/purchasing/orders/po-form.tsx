"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPurchaseOrderAction } from "@/actions/orders";
import { notifyError, notifySuccess } from "@/lib/notify";

const field = "mt-1 block w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d] outline-none focus:border-[#6d4aff]";

export function PurchaseOrderForm({ suppliers, products }: {
  suppliers: { id: string; name: string }[];
  products: { id: string; sku: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-5 rounded-xl border border-[#e9e6f3] bg-white p-4">
      <button onClick={() => setOpen(!open)} className="rounded-lg bg-[#6d4aff] px-4 py-2 text-xs font-medium text-white hover:bg-[#5a36e0]">
        {open ? "收合表單" : "＋ 新增採購單"}
      </button>
      {open && (
        <form action={(fd) => {
          setMsg("");
          startTransition(async () => {
            try {
              const no = await createPurchaseOrderAction(fd);
              setMsg(`已建立 ${no}`); notifySuccess(`已建立 ${no}`);
              setOpen(false);
              router.refresh();
            } catch (e) { setMsg(e instanceof Error ? e.message : "新增失敗"); notifyError(e, "新增失敗"); }
          });
        }} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs text-[#8c88a6]">供應商 *
            <select name="supplierId" required className={field}>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-[#8c88a6]">商品
            <select name="productId" className={field}>
              <option value="">（不指定）</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </label>
          <label className="text-xs text-[#8c88a6]">品名 *<input name="description" required placeholder="品名 / 型號" className={field} /></label>
          <label className="text-xs text-[#8c88a6]">數量<input name="qty" type="number" min="1" defaultValue="1" className={field} /></label>
          <label className="text-xs text-[#8c88a6]">單價<input name="price" type="number" min="0" step="0.01" required className={field} /></label>
          <label className="text-xs text-[#8c88a6]">預計到貨日<input name="expectedDate" type="date" className={field} /></label>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
            <button type="submit" disabled={pending} className="h-9 rounded-lg bg-[#6d4aff] px-4 text-xs font-medium text-white disabled:opacity-50">
              {pending ? "建立中…" : "建立採購單"}
            </button>
            {msg && <span className={`text-xs ${msg.startsWith("已建立") ? "text-[#0d8a45]" : "text-[#e05a5a]"}`}>{msg}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
