"use client";
export function PrintButton({ orderNo }: { orderNo: string }) {
  return (
    <button onClick={() => window.print()} className="h-9 rounded-lg border border-[#e9e6f3] bg-white px-3 text-xs text-[#57536e] hover:bg-[#fbfaff]">
      輸出 / 預覽 {orderNo}
    </button>
  );
}
