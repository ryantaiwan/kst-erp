import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuoteDetail } from "../actions";
import { PageHeader } from "@/components/page-header";
import { formatDate, formatMoney } from "@/lib/utils";
import { QuoteActions } from "./quote-actions";

export const instant = false;

const STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  confirmed: "已確認",
  converted: "已轉訂單",
  expired: "已過期",
};

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getQuoteDetail(id);
  if (!detail) notFound();

  const { quote, customer, contact, items } = detail;

  return (
    <>
      <PageHeader
        title={`報價單 ${quote.quoteNo}`}
        subtitle={`${customer?.name ?? "—"} · 報價日期 ${formatDate(quote.quoteDate)}`}
        right={
          <div className="flex items-center gap-2">
            <Link
              href="/sales/quotes"
              className="rounded-lg border border-[#e9e6f3] bg-white px-3 py-2 text-xs text-[#57536e] no-underline"
            >
              返回列表
            </Link>
            <QuoteActions quoteId={quote.id} status={quote.status} />
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <section className="rounded-xl border border-[#e9e6f3] bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-[#26223d]">品項明細</h2>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#f1eff7] text-left text-[#9b96b0]">
                  <th className="w-8 py-2 font-medium">#</th>
                  <th className="py-2 font-medium">品名 / 型號 / 規格 / 說明</th>
                  <th className="w-20 py-2 text-right font-medium">數量</th>
                  <th className="w-16 py-2 font-medium">單位</th>
                  <th className="w-28 py-2 text-right font-medium">單價</th>
                  <th className="w-32 py-2 text-right font-medium">小計</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-b border-[#f8f7fc]">
                    <td className="py-2 text-[#9b96b0]">{it.lineNo}</td>
                    <td className="py-2 text-[#26223d]">
                      {it.description.split("\n").map((line, i) => (
                        <span key={i} className="block">
                          {line}
                        </span>
                      ))}
                    </td>
                    <td className="py-2 text-right">{it.qty}</td>
                    <td className="py-2">{it.unit}</td>
                    <td className="py-2 text-right">{formatMoney(it.priceCents)}</td>
                    <td className="py-2 text-right">{formatMoney(it.subtotalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex flex-col items-end gap-1 border-t border-[#f1eff7] pt-4 text-xs">
              <div className="flex w-64 justify-between text-[#8c88a6]">
                <span>小計（未稅）</span>
                <span className="text-[#26223d]">{formatMoney(quote.subtotalCents)}</span>
              </div>
              <div className="flex w-64 justify-between text-[#8c88a6]">
                <span>稅金（{(quote.taxRateSnapshot / 100).toFixed(0)}%）</span>
                <span className="text-[#26223d]">{formatMoney(quote.taxCents)}</span>
              </div>
              <div className="flex w-64 justify-between border-t border-[#e9e6f3] pt-1 text-sm font-semibold">
                <span>合計（含稅）</span>
                <span className="text-[#5538d6]">{formatMoney(quote.totalCents)}</span>
              </div>
            </div>
          </section>

          {quote.note ? (
            <section className="rounded-xl border border-[#e9e6f3] bg-white p-5">
              <h2 className="mb-2 text-sm font-semibold text-[#26223d]">備註</h2>
              <div className="space-y-1 text-xs leading-6 text-[#57536e]">
                {quote.note.split("\n").map((n, i) => (
                  <p key={i}>{i + 1}、{n}</p>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-5">
          <section className="rounded-xl border border-[#e9e6f3] bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-[#26223d]">客戶資訊</h2>
            <dl className="space-y-2 text-xs">
              <Row label="客戶名稱" value={customer?.name} />
              <Row label="統編" value={customer?.taxId} />
              <Row label="聯絡人" value={contact?.name} />
              <Row label="聯絡電話" value={contact?.mobile ?? contact?.phone} />
              <Row label="地址" value={customer?.address} />
              <Row label="付款條件" value={customer?.paymentTerm} />
            </dl>
          </section>

          <section className="rounded-xl border border-[#e9e6f3] bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-[#26223d]">單據資訊</h2>
            <dl className="space-y-2 text-xs">
              <Row label="報價單號" value={quote.quoteNo} />
              <Row label="狀態" value={STATUS_LABEL[quote.status] ?? quote.status} />
              <Row label="報價日期" value={formatDate(quote.quoteDate)} />
              <Row label="有效期限" value={formatDate(quote.validUntil)} />
              <Row label="稅率快照" value={`${(quote.taxRateSnapshot / 100).toFixed(0)}%`} />
              <Row label="經辦人" value={quote.handler} />
            </dl>
          </section>
        </aside>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 text-[#9b96b0]">{label}</dt>
      <dd className="min-w-0 flex-1 break-words text-[#26223d]">{value || "—"}</dd>
    </div>
  );
}
