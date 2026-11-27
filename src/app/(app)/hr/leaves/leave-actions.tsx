"use client";

import { useTransition } from "react";
import { approveLeave, cancelLeave } from "./actions";

export function LeaveActions({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();

  if (status !== "pending") return <span className="text-[#c9c5d6]">—</span>;

  return (
    <span className="flex gap-1">
      <button
        disabled={pending}
        onClick={() => startTransition(() => approveLeave(id, true))}
        className="rounded border border-[#b7e4c8] bg-[#f0faf4] px-2 py-1 text-[11px] text-[#0d8a45] hover:bg-[#e0f4e8] disabled:opacity-50"
      >
        核准
      </button>
      <button
        disabled={pending}
        onClick={() => startTransition(() => approveLeave(id, false))}
        className="rounded border border-[#f0caca] bg-[#fff5f5] px-2 py-1 text-[11px] text-[#e05a5a] hover:bg-[#ffeaea] disabled:opacity-50"
      >
        駁回
      </button>
      <button
        disabled={pending}
        onClick={() => startTransition(() => cancelLeave(id))}
        className="rounded border border-[#e9e6f3] px-2 py-1 text-[11px] text-[#9b96b0] hover:bg-[#fbfaff] disabled:opacity-50"
      >
        取消
      </button>
    </span>
  );
}
