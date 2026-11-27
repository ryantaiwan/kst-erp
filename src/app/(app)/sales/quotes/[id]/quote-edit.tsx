"use client";
import { useState, useTransition } from "react";
import { updateQuote } from "@/actions/transactions";

type Item = { description: string; qty: number; price: number };
type Customer = { id: string; name: string };

export function QuoteEdit({ quoteId, customerId, customers, handler, note, validUntil, items: initialItems }: {
  quoteId: string; customerId: string; customers: Customer[]; handler: string; note: string; validUntil: string; items: Item[];
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>(initialItems);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");
  const field = "w-full rounded border border-[#e9e6f3] px-2 py-1 text-[11px]";

  return (
    <div className="mb-5 rounded-xl border border-[#e9e6f3] bg-white p-4">
      <button onClick={() => setOpen(!open)} className="rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#57536e]">{open ? "收合編輯" : "編輯報價單"}</button>
      {open && (
        <form action={(fd) => { setMsg(""); startTransition(async () => { try { await updateQuote(quoteId, fd); setMsg("已更新"); } catch (e) { setMsg(e instanceof Error ? e.message : "失敗"); } }); }} className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-3">
            <label className="text-xs text-[#8c88a6]">客戶<select name="customerId" defaultValue={customerId} className={field}>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="text-xs text-[#8c88a6]">承辦人<input name="handler" defaultValue={handler} className={field} /></label>
            <label className="text-xs text-[#8c88a6]">有效期<input name="validUntil" type="date" defaultValue={validUntil} className={field} /></label>
            <label className={`${field} flex-1 text-xs text-[#8c88a6]`}>備註<input name="note" defaultValue={note} className={`mt-1 ${field}`} /></label>
          </div>
          <div className="space-y-2">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input name={`item_${idx}_description`} value={it.description} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} className={`${field} flex-1`} />
                <input name={`item_${idx}_qty`} type="number" value={it.qty} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, qty: Number(e.target.value) } : x))} className={`${field} w-16`} />
                <input name={`item_${idx}_price`} type="number" value={it.price} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, price: Number(e.target.value) } : x))} className={`${field} w-24`} />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setItems([...items, { description: "", qty: 1, price: 0 }])} className="rounded border border-[#e9e6f3] px-3 py-2 text-xs">＋ 品項</button>
            <button type="submit" disabled={pending} className="rounded-lg bg-[#6d4aff] px-4 py-2 text-xs text-white disabled:opacity-50">{pending ? "儲存中…" : "儲存變更"}</button>
            {msg && <span className="text-xs text-[#5538d6]">{msg}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
