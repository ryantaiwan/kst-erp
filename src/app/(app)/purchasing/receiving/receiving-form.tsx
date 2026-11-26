"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createReceiving } from "./actions";

type PendingItem = {
  id: string;
  productId: string | null;
  description: string;
  qty: number;
  receivedQty: number;
  pendingQty: number;
};

type Order = {
  id: string;
  poNo: string;
  supplierName: string;
  items: PendingItem[];
};

type Warehouse = { id: string; name: string };

type Line = {
  orderItemId: string;
  productId: string | null;
  description: string;
  pendingQty: number;
  qty: string;
  releaseNo: string;
  auSku: string;
  serialNo: string;
};

export function ReceivingForm({ orders, warehouses }: { orders: Order[]; warehouses: Warehouse[] }) {
  const router = useRouter();
  const [orderId, setOrderId] = useState(orders[0]?.id ?? "");
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const current = orders.find((o) => o.id === orderId);

  useEffect(() => {
    if (!current) {
      setLines([]);
      return;
    }
    setLines(
      current.items.map((i) => ({
        orderItemId: i.id,
        productId: i.productId,
        description: i.description,
        pendingQty: i.pendingQty,
        qty: String(i.pendingQty),
        releaseNo: "",
        auSku: "",
        serialNo: "",
      })),
    );
  }, [orderId, current]);

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-[#e9e6f3] bg-white p-8 text-center text-sm text-[#8c88a6]">
        目前沒有待入庫的採購訂單。可先於「採購訂單」建立訂單。
      </div>
    );
  }

  const update = (i: number, key: keyof Line, value: string) => {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [key]: value } : l)));
  };

  return (
    <div className="rounded-xl border border-[#e9e6f3] bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-[#8c88a6]">
          採購訂單
          <select
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d]"
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.poNo} · {o.supplierName} · 待收 {o.items.reduce((s, i) => s + i.pendingQty, 0)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[#8c88a6]">
          入庫倉庫
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d]"
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[#8c88a6]">
          備註
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-[#e9e6f3] px-3 py-2 text-xs text-[#26223d]"
          />
        </label>
      </div>

      <table className="mt-4 w-full text-[12px]">
        <thead>
          <tr className="text-left text-[#9b96b0]">
            <th className="py-1 font-medium">品名</th>
            <th className="w-20 py-1 text-right font-medium">待收</th>
            <th className="w-20 py-1 font-medium">實收</th>
            <th className="w-32 py-1 font-medium">Release No</th>
            <th className="w-28 py-1 font-medium">AU SKU</th>
            <th className="w-36 py-1 font-medium">Serial No</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={l.orderItemId}>
              <td className="py-1 pr-2 text-[#26223d]">{l.description}</td>
              <td className="py-1 pr-2 text-right text-[#8c88a6]">{l.pendingQty}</td>
              <td className="py-1 pr-2">
                <input
                  value={l.qty}
                  onChange={(e) => update(i, "qty", e.target.value)}
                  type="number"
                  min="0"
                  max={l.pendingQty}
                  className="w-full rounded-lg border border-[#e9e6f3] px-2 py-1.5 text-xs text-[#26223d]"
                />
              </td>
              <td className="py-1 pr-2">
                <input
                  value={l.releaseNo}
                  onChange={(e) => update(i, "releaseNo", e.target.value)}
                  className="w-full rounded-lg border border-[#e9e6f3] px-2 py-1.5 text-xs text-[#26223d]"
                />
              </td>
              <td className="py-1 pr-2">
                <input
                  value={l.auSku}
                  onChange={(e) => update(i, "auSku", e.target.value)}
                  className="w-full rounded-lg border border-[#e9e6f3] px-2 py-1.5 text-xs text-[#26223d]"
                />
              </td>
              <td className="py-1">
                <input
                  value={l.serialNo}
                  onChange={(e) => update(i, "serialNo", e.target.value)}
                  className="w-full rounded-lg border border-[#e9e6f3] px-2 py-1.5 text-xs text-[#26223d]"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => {
            setMsg(null);
            const items = lines
              .filter((l) => Number(l.qty) > 0)
              .map((l) => ({
                orderItemId: l.orderItemId,
                productId: l.productId ?? undefined,
                releaseNo: l.releaseNo || undefined,
                auSku: l.auSku || undefined,
                serialNo: l.serialNo || undefined,
                qty: Number(l.qty),
              }));

            if (items.length === 0) {
              setMsg("請至少填寫一筆入庫數量");
              return;
            }

            startTransition(async () => {
              try {
                const no = await createReceiving({ poId: orderId, warehouseId, note, items });
                setMsg(`已建立入庫單 ${no}`);
                router.refresh();
              } catch (e) {
                setMsg(e instanceof Error ? e.message : "入庫失敗");
              }
            });
          }}
          disabled={pending}
          className="ml-auto rounded-lg bg-[#6d4aff] px-5 py-2 text-xs text-white disabled:opacity-50"
        >
          {pending ? "入庫中…" : "建立入庫單"}
        </button>
      </div>

      {msg ? <p className="mt-2 text-xs text-[#8c88a6]">{msg}</p> : null}
    </div>
  );
}
