"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createShipment } from "./actions";

type Order = {
  id: string;
  soNo: string;
  customerName: string;
  pendingQty: number;
};

export function ShipmentForm({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [soId, setSoId] = useState(orders[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-[#e9e6f3] bg-white p-8 text-center text-sm text-[#8c88a6]">
        目前沒有待出貨的銷貨訂單。可先於「銷貨訂單」建立訂單。
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#e9e6f3] bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-72 text-xs text-[#8c88a6]">
          待出貨訂單
          <select
            value={soId}
            onChange={(e) => setSoId(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d]"
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.soNo} · {o.customerName} · 待出 {o.pendingQty}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-56 flex-1 text-xs text-[#8c88a6]">
          備註
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="出貨單號 / 物流 / 備註"
            className="mt-1 block w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d]"
          />
        </label>
        <button
          onClick={() => {
            setMsg(null);
            startTransition(async () => {
              try {
                const no = await createShipment(soId, note);
                setNote("");
                setMsg(`已建立出貨單 ${no}`);
                router.refresh();
              } catch (e) {
                setMsg(e instanceof Error ? e.message : "出貨失敗");
              }
            });
          }}
          disabled={pending}
          className="rounded-lg bg-[#6d4aff] px-4 py-2 text-xs text-white disabled:opacity-50"
        >
          {pending ? "出貨中…" : "建立出貨單"}
        </button>
      </div>
      {msg ? <p className="mt-2 text-xs text-[#8c88a6]">{msg}</p> : null}
    </div>
  );
}
