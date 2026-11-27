import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { pageInfo, PAGE_SIZE } from "@/lib/period";

/** 單純分頁（無年度 / 期別），適用於沒有歷史日期欄位的資料表。 */
export function SimplePagination({
  page,
  total,
  basePath,
  extraFilters,
}: {
  page: number;
  total: number;
  basePath: string;
  extraFilters?: Record<string, string | undefined>;
}) {
  const info = pageInfo(page, total, PAGE_SIZE);
  const href = (p: number) => {
    const q = new URLSearchParams();
    q.set("page", String(p));
    for (const [k, v] of Object.entries(extraFilters ?? {})) if (v) q.set(k, v);
    return `${basePath}?${q.toString()}`;
  };

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8c88a6]">
      <span>
        共 {total.toLocaleString("zh-TW")} 筆 · 每頁 {PAGE_SIZE} 筆
        {total > 0 && <> · 顯示 {info.start}–{info.end}</>}
      </span>
      <div className="flex items-center gap-1">
        <Link href={href(Math.max(1, info.current - 1))} className={`grid h-8 w-8 place-items-center rounded-lg border border-[#e9e6f3] ${info.hasPrev ? "text-[#57536e] hover:bg-[#fbfaff]" : "pointer-events-none text-[#d3d0df]"}`} aria-label="上一頁">
          <ChevronLeft size={15} />
        </Link>
        <span className="px-2 text-[#26223d]">{info.current} / {info.totalPages}</span>
        <Link href={href(Math.min(info.totalPages, info.current + 1))} className={`grid h-8 w-8 place-items-center rounded-lg border border-[#e9e6f3] ${info.hasNext ? "text-[#57536e] hover:bg-[#fbfaff]" : "pointer-events-none text-[#d3d0df]"}`} aria-label="下一頁">
          <ChevronRight size={15} />
        </Link>
      </div>
    </div>
  );
}
