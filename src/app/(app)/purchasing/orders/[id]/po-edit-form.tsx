"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePurchaseOrder } from "@/actions/orders";
import { TotalsBlock } from "@/components/totals-block";
import { notifyError, notifySuccess } from "@/lib/notify";

type Item = { id: string; description: string; qty: number; receivedQty: number; price: number };
const field = "w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d] outline-none focus:border-[#6d4aff]";
const STATUS = ["confirmed", "partial_received", "received", "cancelled"];
const LABEL: Record<string,string> = { confirmed:"已確認", partial_received:"部分入庫", received:"已入庫", cancelled:"取消" };

export function PoEditForm({ id, supplierId, status, expectedDate, suppliers, items: initial, total }: {
  id: string; supplierId: string; status: string; expectedDate: string;
  suppliers: { id: string; name: string }[];
  items: Item[];
  total: number;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");
  const computed = items.reduce((s, i) => s + (i.qty || 0) * (i.price || 0), 0);

  return (
    <form action={(fd) => {
      setMsg("");
      startTransition(async () => {
        try { await updatePurchaseOrder(id, fd); setMsg("已儲存"); notifySuccess("已儲存"); router.refresh(); }
        catch (e) { setMsg(e instanceof Error ? e.message : "儲存失敗"); notifyError(e, "儲存失敗"); }
      });
    }} className="space-y-4">
      <input type="hidden" name="itemIds" value={items.map((i) => i.id).join(",")} />
      <section className="rounded-xl border border-[#e9e6f3] bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold">訂單資訊</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="text-xs text-[#8c88a6]">供應商
            <select name="supplierId" defaultValue={supplierId} className={`mt-1 ${field}`}>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-[#8c88a6]">狀態
            <select name="status" defaultValue={status} className={`mt-1 ${field}`}>
              {STATUS.map((s) => <option key={s} value={s}>{LABEL[s] ?? s}</option>)}
            </select>
          </label>
          <label className="text-xs text-[#8c88a6]">預計到貨日
            <input name="expectedDate" type="date" defaultValue={expectedDate} className={`mt-1 ${field}`} />
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
                已入 {it.receivedQty}/{it.qty}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-[#f1eff7] pt-3 text-xs">
          <TotalsBlock
            className="w-full sm:w-72"
            lines={[
              { label: "總計", value: computed.toLocaleString("zh-TW", { minimumFractionDigits: 2 }), strong: true, tone: "accent" },
            ]}
          />
          <div className="flex items-center gap-2">
            <button type="submit" disabled={pending} className="h-9 rounded-lg bg-[#6d4aff] px-4 text-xs font-medium text-white disabled:opacity-50">
              {pending ? "儲存中…" : "儲存變更"}
            </button>
            {msg && <span className="text-xs text-[#5538d6]">{msg}</span>}
          </div>
        </div>
      </section>
    </form>
  );
}
