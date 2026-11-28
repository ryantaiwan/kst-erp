/**
 * 合計金額區塊：標籤在左、金額靠右，所有頁面一致。
 * 金額一律自動靠格子右邊對齊。
 */
export type TotalLine = {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "default" | "accent";
};

export function TotalsBlock({
  lines,
  className = "",
}: {
  lines: TotalLine[];
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {lines.map((line, i) => (
        <div
          key={`${line.label}-${i}`}
          className={`flex items-center justify-between gap-6 border-t border-[#f1eff7] pt-1 text-xs ${
            line.strong ? "text-sm font-semibold" : ""
          }`}
        >
          <span className={line.strong ? "text-[#26223d]" : "text-[#8c88a6]"}>{line.label}</span>
          <span className={`ml-auto text-right tabular-nums ${line.tone === "accent" ? "text-[#5538d6]" : "text-[#26223d]"}`}>
            {line.value}
          </span>
        </div>
      ))}
    </div>
  );
}
