"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { closeRfq, convertRfqToPo } from "./actions";

export function RfqActions({ rfqId, status }: { rfqId: string; status: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (status === "converted" || status === "closed") {
    return <span className="text-[11px] text-[#9b96b0]">{status === "converted" ? "已轉採購單" : "已結案"}</span>;
  }

  return (
    <div className="flex items-center gap-2">
      {msg ? <span className="text-[11px] text-[#8c88a6]">{msg}</span> : null}
      <button
        onClick={() =>
          startTransition(async () => {
            setMsg(null);
            try {
              const poNo = await convertRfqToPo(rfqId, "");
              setMsg(`已轉採購單 ${poNo}`);
              router.refresh();
            } catch (e) {
              setMsg(e instanceof Error ? e.message : "轉單失敗");
            }
          })
        }
        disabled={pending}
        className="rounded-md bg-[#6d4aff] px-2 py-1 text-[11px] text-white disabled:opacity-50"
      >
        轉採購單
      </button>
      <button
        onClick={() =>
          startTransition(async () => {
            setMsg(null);
            try {
              await closeRfq(rfqId);
              setMsg("已結案");
              router.refresh();
            } catch (e) {
              setMsg(e instanceof Error ? e.message : "操作失敗");
            }
          })
        }
        disabled={pending}
        className="rounded-md border border-[#e9e6f3] px-2 py-1 text-[11px] text-[#57536e] disabled:opacity-50"
      >
        結案
      </button>
    </div>
  );
}
