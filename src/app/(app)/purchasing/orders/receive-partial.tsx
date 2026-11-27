"use client";
import { useEffect, useState, useTransition } from "react";
import { receivePartial } from "@/actions/transactions";

type Item = { id: string; description: string; qty: number; receivedQty: number };

export function ReceivePartial({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!open) return;
    fetch(`/api/purchase-orders/${orderId}/items`).then((r) => r.json()).then(setItems).catch(() => setItems([]));
  }, [open, orderId]);

  return (
    <span>
      <button onClick={() => setOpen(!open)} className="text-[11px] text-[#5538d6] hover:underline">{open ? "收合" : "部分入庫"}</button>
      {open && (
        <span className="mt-2 block space-y-2 rounded-lg bg-[#fbfaff] p-3">
          {msg && <span className="block text-[11px] text-[#e05a5a]">{msg}</span>}
          {items.map((it) => (
            <ReceiveRow key={it.id} item={it} disabled={pending}
              onSave={(qty) => { setMsg(""); startTransition(async () => { try { await receivePartial(orderId, it.id, qty); setMsg("已入庫"); } catch (e) { setMsg(e instanceof Error ? e.message : "失敗"); } }); }} />
          ))}
        </span>
      )}
    </span>
  );
}

function ReceiveRow({ item, disabled, onSave }: { item: Item; disabled: boolean; onSave: (qty: number) => void }) {
  const [qty, setQty] = useState("1");
  const remaining = item.qty - item.receivedQty;
  return (
    <span className="flex items-center gap-2 text-[11px]">
      <span className="w-32 truncate">{item.description} ({item.receivedQty}/{item.qty})</span>
      <input value={qty} onChange={(e) => setQty(e.target.value)} type="number" min="1" max={remaining} className="w-16 rounded border border-[#e9e6f3] px-2 py-1" />
      <button disabled={disabled || remaining <= 0} onClick={() => onSave(Number(qty))} className="rounded bg-[#6d4aff] px-2 py-1 text-white disabled:opacity-50">入庫</button>
    </span>
  );
}
