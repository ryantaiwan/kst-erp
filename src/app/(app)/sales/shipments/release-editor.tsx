"use client";
import { useEffect, useState, useTransition } from "react";
import { linkReleaseNo } from "@/actions/transactions";

type Item = { id: string; description: string; qty: number; releaseNo: string | null; serialNo: string | null };

export function ReleaseEditor({ shipmentId }: { shipmentId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    fetch(`/api/shipments/${shipmentId}/items`).then((r) => r.json()).then(setItems).catch(() => setItems([]));
  }, [open, shipmentId]);

  return (
    <div className="inline-block">
      <button onClick={() => setOpen(!open)} className="text-[11px] text-[#5538d6] hover:underline">
        {open ? "收合" : "品項/放行單"}
      </button>
      {open && (
        <div className="mt-2 space-y-2 rounded-lg bg-[#fbfaff] p-3 text-left" onClick={(e) => e.stopPropagation()}>
          {items.length === 0 && <div className="text-[11px] text-[#9b96b0]">載入中或無品項</div>}
          {items.map((it) => <ReleaseRow key={it.id} item={it} disabled={pending} onSave={(rel, ser) => startTransition(() => linkReleaseNo(it.id, rel, ser))} />)}
        </div>
      )}
    </div>
  );
}

function ReleaseRow({ item, disabled, onSave }: { item: Item; disabled: boolean; onSave: (rel: string, ser: string) => void }) {
  const [rel, setRel] = useState(item.releaseNo ?? "");
  const [ser, setSer] = useState(item.serialNo ?? "");
  const input = "w-28 rounded border border-[#e9e6f3] px-2 py-1 text-[11px]";
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px]">
      <span className="w-32 truncate text-[#57536e]">{item.description} ×{item.qty}</span>
      <input value={rel} onChange={(e) => setRel(e.target.value)} placeholder="Release No" className={input} />
      <input value={ser} onChange={(e) => setSer(e.target.value)} placeholder="Serial No" className={input} />
      <button disabled={disabled} onClick={() => onSave(rel, ser)} className="rounded bg-[#6d4aff] px-2 py-1 text-[11px] text-white disabled:opacity-50">存</button>
    </div>
  );
}
