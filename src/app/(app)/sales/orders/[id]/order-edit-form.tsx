"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSalesOrder } from "@/actions/orders";
import { notifyError, notifySuccess } from "@/lib/notify";

type Item = { id: string; description: string; qty: number; shippedQty: number; price: number; subtotal: number };
const field = "w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d] outline-none focus:border-[#6d4aff]";
const STATUS = ["draft", "confirmed", "shipped", "partial_shipped", "done", "cancelled"];
const LABEL: Record<string,string> = { draft:"草稿", confirmed:"已確認", shipped:"已出貨", partial_shipped:"部分出貨", done:"完成", cancelled:"取消" };

export function OrderEditForm({ id, customerId, status, expectedShipDate, customers, products: _products, items: initial, totals }: {
  id: string; customerId: string; status: string; expectedShipDate: string;
  customers: { id: string; name: string }[];
  products: { id: string; sku: string; name: string }[];
  items: Item[];
  totals: { subtotal: number; tax: number; total: number };
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");

  return (
    <form action={(fd) => {
      setMsg("");
      startTransition(async () => {
        try { await updateSalesOrder(id, fd); setMsg("已儲存"); notifySuccess("已儲存"); router.refresh(); }
        catch (e) { setMsg(e instanceof Error ? e.message : "儲存失敗"); notifyError(e, "儲存失敗"); }
      });
    }} className="space-y-4">
      <input type="hidden" name="itemIds" value={items.map((i) => i.id).join(",")} />
      <section className="rounded-xl border border-[#e9e6f3] bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold">訂單資訊</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="text-xs text-[#8c88a6]">客戶
            <select name="customerId" defaultValue={customerId} className={`mt-1 ${field}`}>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-[#8c88a6]">狀態
            <select name="status" defaultValue={status} className={`mt-1 ${field}`}>
              {STATUS.map((s) => <option key={s} value={s}>{LABEL[s] ?? s}</option>)}
            </select>
          </label>
          <label className="text-xs text-[#8c88a6]">預計出貨日
            <input name="expectedShipDate" type="date" defaultValue={expectedShipDate} className={`mt-1 ${field}`} />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-[#e9e6f3] bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold">品項明細</h2>
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={it.id} className="grid grid-cols-1 gap-2 rounded-lg bg-[#fbfaff] p-3 sm:grid-cols-[1fr_80px_100px_100px]">
              <input name={`item_${it.id}_description`} value={it.description}
                onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))}
                className={field} />
              <input name={`item_${it.id}_qty`} type="number" min="1" value={it.qty}
                onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, qty: Number(e.target.value) } : x))}
                className={field} />
              <input name={`item_${it.id}_price`} type="number" min="0" step="0.01" value={it.price}
                onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, price: Number(e.target.value) } : x))}
                className={field} />
              <div className="flex items-center text-xs text-[#57536e]">
                小計 {((it.qty || 0) * (it.price || 0)).toLocaleString("zh-TW", { minimumFractionDigits: 2 })}
                <span className="ml-1 text-[10px] text-[#9b96b0]">已出 {it.shippedQty}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#f1eff7] pt-3 text-xs">
          <div className="flex gap-4">
            <span className="text-[#8c88a6]">未稅 {totals.subtotal.toLocaleString("zh-TW")}</span>
            <span className="text-[#8c88a6]">稅金 {totals.tax.toLocaleString("zh-TW")}</span>
            <span className="font-semibold text-[#5538d6]">總計 {totals.total.toLocaleString("zh-TW")}</span>
          </div>
          <button type="submit" disabled={pending} className="h-9 rounded-lg bg-[#6d4aff] px-4 text-xs font-medium text-white disabled:opacity-50">
            {pending ? "儲存中…" : "儲存變更"}
          </button>
          {msg && <span className="text-xs text-[#5538d6]">{msg}</span>}
        </div>
      </section>
    </form>
  );
}
