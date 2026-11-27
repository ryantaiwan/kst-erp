"use client";
import { useTransition } from "react";
import { updateSalesOrderStatus } from "@/actions/transactions";
const STATUS = ["draft", "confirmed", "shipped", "partial_shipped", "done", "cancelled"];
const LABEL: Record<string,string> = { draft:"草稿", confirmed:"已確認", shipped:"已出貨", partial_shipped:"部分出貨", done:"完成", cancelled:"取消" };
export function OrderStatusEditor({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <select value={status} disabled={pending} onChange={(e) => startTransition(() => updateSalesOrderStatus(id, e.target.value))}
      className="rounded border border-[#e9e6f3] px-2 py-1 text-[11px] disabled:opacity-50">
      {STATUS.map((s) => <option key={s} value={s}>{LABEL[s] ?? s}</option>)}
    </select>
  );
}
