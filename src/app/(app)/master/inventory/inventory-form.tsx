"use client";
import { useState, useTransition } from "react";
import { adjustInventory } from "@/actions/master";

export function InventoryForm({ products, warehouses }: { products: { id: string; sku: string; name: string }[]; warehouses: { id: string; code: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const field = "w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs outline-none focus:border-[#6d4aff]";

  return (
    <div className="mb-5 rounded-xl border border-[#e9e6f3] bg-white p-4">
      <button onClick={() => setOpen(!open)} className="rounded-lg bg-[#6d4aff] px-4 py-2 text-xs font-medium text-white hover:bg-[#5a36e0]">
        {open ? "收合表單" : "＋ 調整庫存"}
      </button>
      {open && (
        <form action={(fd) => { setMessage(""); startTransition(async () => { try { await adjustInventory(fd); setOpen(false); } catch (e) { setMessage(e instanceof Error ? e.message : "調整失敗"); } }); }} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-[#8c88a6]">商品 *
            <select name="productId" required className={`mt-1 ${field}`}>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </label>
          <label className="text-xs text-[#8c88a6]">倉庫 *
            <select name="warehouseId" required className={`mt-1 ${field}`}>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.code} {w.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-[#8c88a6]">調整數量（可負）*<input name="delta" type="number" step="1" required className={`mt-1 ${field}`} placeholder="例：10 或 -3" /></label>
          <label className="text-xs text-[#8c88a6]">備註<input name="note" className={`mt-1 ${field}`} placeholder="調整原因" /></label>
          <div className="flex items-end gap-2">
            <button type="submit" disabled={pending} className="rounded-lg bg-[#6d4aff] px-4 py-2 text-xs font-medium text-white hover:bg-[#5a36e0] disabled:opacity-50">{pending ? "處理中…" : "確認調整"}</button>
            {message && <span className="text-xs text-[#e05a5a]">{message}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
