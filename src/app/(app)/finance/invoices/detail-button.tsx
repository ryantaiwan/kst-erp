"use client";
import { useState } from "react";
import { InvoiceDetail, type InvoiceRow } from "@/components/invoice-detail";

export function DetailButton({ row }: { row: InvoiceRow }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="text-[11px] text-[#5538d6] hover:underline">查看</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <InvoiceDetail row={row} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
