import { NextResponse } from "next/server";
import { getQuoteDetail } from "@/app/(app)/sales/quotes/actions";
import { generateQuotePdf } from "@/lib/quote-pdf";

export const instant = false;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getQuoteDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "找不到報價單" }, { status: 404 });
  }

  const { quote, customer, contact, items } = detail;

  const pdf = await generateQuotePdf({
    quoteNo: quote.quoteNo,
    quoteDate: quote.quoteDate,
    validUntil: quote.validUntil,
    customerName: customer?.name ?? "",
    contactName: contact?.name ?? null,
    contactPhone: contact?.mobile ?? contact?.phone ?? null,
    customerTaxId: customer?.taxId ?? null,
    customerAddress: customer?.address ?? null,
    handler: quote.handler,
    taxRateBasisPoints: quote.taxRateSnapshot,
    subtotalCents: quote.subtotalCents,
    taxCents: quote.taxCents,
    totalCents: quote.totalCents,
    note: quote.note,
    items: items.map((i) => ({
      lineNo: i.lineNo,
      description: i.description,
      qty: i.qty,
      unit: i.unit,
      priceCents: i.priceCents,
      subtotalCents: i.subtotalCents,
    })),
  });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${quote.quoteNo}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
