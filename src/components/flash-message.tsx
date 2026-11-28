"use client";

import { useEffect, useState } from "react";
import { readFlash, type Flash } from "@/lib/notify";

/** 顯示跨 router.refresh() 保留的操作結果訊息 */
export function FlashMessage() {
  const [flash, setFlash] = useState<Flash | null>(null);

  useEffect(() => {
    const show = (detail?: Flash) => {
      const f = detail ?? readFlash();
      if (f) setFlash(f);
    };
    const handler = (e: Event) => show((e as CustomEvent<Flash>).detail);
    show();
    window.addEventListener("kst-flash", handler);
    return () => window.removeEventListener("kst-flash", handler);
  }, []);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), 5000);
    return () => clearTimeout(timer);
  }, [flash]);

  if (!flash) return null;

  return (
    <div className="fixed right-4 top-4 z-[100] max-w-sm">
      <div
        className={`rounded-lg border px-4 py-3 text-xs shadow-lg ${
          flash.type === "success"
            ? "border-[#b7e4c8] bg-[#f0faf4] text-[#0d8a45]"
            : "border-[#f0caca] bg-[#fff5f5] text-[#c0392b]"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="font-medium">{flash.message}</span>
          <button onClick={() => setFlash(null)} className="text-current opacity-60 hover:opacity-100">×</button>
        </div>
      </div>
    </div>
  );
}
