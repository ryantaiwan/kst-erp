"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmQuote, convertQuoteToSalesOrder } from "../actions";
import { archiveQuotePdf } from "@/actions/transactions";
import { notifyError, notifySuccess } from "@/lib/notify";

export function QuoteActions({ quoteId, status }: { quoteId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const run = (fn: () => Promise<string>, ok: string) => {
    setMsg(null);
    startTransition(async () => {
      try {
        const extra = await fn();
        const full = extra ? `${ok}：${extra}` : ok;
        setMsg(full); notifySuccess(full);
        router.refresh();
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "操作失敗"); notifyError(e, "操作失敗");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      {msg ? <span className="text-[11px] text-[#8c88a6]">{msg}</span> : null}
      <a
        href={`/api/quotes/${quoteId}/pdf`}
        target="_blank"
        className="rounded-lg border border-[#e9e6f3] bg-white px-3 py-2 text-xs text-[#57536e] no-underline"
      >
        下載 PDF
      </a>
      {status === "draft" ? (
        <button
          onClick={() => run(async () => {
            await confirmQuote(quoteId);
            try { const r = await archiveQuotePdf(quoteId); return r.archived ? "PDF 已存档" : ""; }
            catch { return ""; } // Blob 存档失败不影响确认
          }, "已確認報價單")}
          disabled={pending}
          className="rounded-lg border border-[#e9e6f3] bg-white px-3 py-2 text-xs text-[#57536e] disabled:opacity-50"
        >
          確認報價
        </button>
      ) : null}
      {status !== "converted" ? (
        <button
          onClick={() => run(() => convertQuoteToSalesOrder(quoteId), "已轉為銷貨訂單")}
          disabled={pending}
          className="rounded-lg bg-[#6d4aff] px-3 py-2 text-xs text-white disabled:opacity-50"
        >
          轉為銷貨訂單
        </button>
      ) : null}
    </div>
  );
}
