import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PERIODS, pageInfo, type PeriodParams } from "@/lib/period";

const selectCls =
  "rounded-lg border border-[#e9e6f3] bg-white px-3 py-2 text-xs text-[#26223d] outline-none focus:border-[#6d4aff]";

/**
 * 記錄瀏覽共用元件：年度 / 期別下拉 + 20 筆分頁。
 * 以 GET 參數導航，server component 直接讀 searchParams。
 */
export function RecordBrowser({
  years,
  params,
  total,
  basePath,
  extraFilters,
  defaultYear,
  defaultPeriod,
}: {
  years: number[];
  params: PeriodParams;
  total: number;
  basePath: string;
  /** 額外保留的篩選參數（如 type、q、filter） */
  extraFilters?: Record<string, string | undefined>;
  /** 無 URL 參數時的預設值（如應收帳款預設當年度前期別） */
  defaultYear?: number;
  defaultPeriod?: number;
}) {
  const info = pageInfo(params.page ? Number(params.page) : 1, total);
  const selectedYear = params.year ?? (defaultYear ? String(defaultYear) : "");
  const selectedPeriod = params.period ?? (defaultPeriod ? String(defaultPeriod) : "0");
  const withExtra = (page: number) => {
    const q = new URLSearchParams();
    if (params.year) q.set("year", params.year);
    if (params.period && params.period !== "0") q.set("period", params.period);
    q.set("page", String(page));
    for (const [k, v] of Object.entries(extraFilters ?? {})) {
      if (v) q.set(k, v);
    }
    return `?${q.toString()}`;
  };

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#e9e6f3] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
      <form action={basePath} method="get" className="flex flex-wrap items-end gap-2">
        <label className="text-[11px] text-[#8c88a6]">
          年度
          <select name="year" defaultValue={selectedYear} className={`mt-1 block w-28 ${selectCls}`}>
            <option value="">全部年度</option>
            {years.map((y) => <option key={y} value={y}>{y} 年</option>)}
          </select>
        </label>
        <label className="text-[11px] text-[#8c88a6]">
          期別
          <select name="period" defaultValue={selectedPeriod} className={`mt-1 block w-28 ${selectCls}`}>
            <option value="0">全年期</option>
            {[...PERIODS].reverse().map((p) => <option key={p.value} value={p.value}>第 {p.value} 期（{p.label}）</option>)}
          </select>
        </label>
        {Object.entries(extraFilters ?? {}).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v ?? ""} />
        ))}
        <button type="submit" className="h-9 rounded-lg bg-[#6d4aff] px-4 text-xs font-medium text-white hover:bg-[#5a36e0]">
          套用
        </button>
        {(params.year || (params.period && params.period !== "0")) && (
          <Link href={basePath} className="flex h-9 items-center rounded-lg border border-[#e9e6f3] px-3 text-xs text-[#57536e] hover:bg-[#fbfaff]">
            清除
          </Link>
        )}
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8c88a6]">
        <span>
          共 {total.toLocaleString("zh-TW")} 筆
          {total > 0 && <> · 顯示 {info.start}–{info.end}</>}
        </span>
        <div className="flex items-center gap-1">
          <Link
            href={basePath + withExtra(Math.max(1, info.current - 1))}
            className={`grid h-8 w-8 place-items-center rounded-lg border border-[#e9e6f3] ${info.hasPrev ? "text-[#57536e] hover:bg-[#fbfaff]" : "pointer-events-none text-[#d3d0df]"}`}
            aria-label="上一頁"
          >
            <ChevronLeft size={15} />
          </Link>
          <span className="px-2 text-[#26223d]">
            {info.current} / {info.totalPages}
          </span>
          <Link
            href={basePath + withExtra(Math.min(info.totalPages, info.current + 1))}
            className={`grid h-8 w-8 place-items-center rounded-lg border border-[#e9e6f3] ${info.hasNext ? "text-[#57536e] hover:bg-[#fbfaff]" : "pointer-events-none text-[#d3d0df]"}`}
            aria-label="下一頁"
          >
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
