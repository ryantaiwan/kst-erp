import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { formatDate, formatMoney } from "@/lib/utils";
import { getPurchaseOrderDetail } from "@/actions/orders";
import { PoEditForm } from "./po-edit-form";
import { PrintButton } from "./print-button";

export const instant = false;

export default async function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getPurchaseOrderDetail(id);
  if (!detail) notFound();
  const { order, supplier, items, products } = detail;

  return (
    <>
      <PageHeader
        title={`採購訂單 ${order.poNo}`}
        subtitle={`${supplier?.name ?? "—"} · 建立日 ${formatDate(order.createdAt)}`}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/purchasing/orders" className="rounded-lg border border-[#e9e6f3] bg-white px-3 py-2 text-xs text-[#57536e] no-underline">返回列表</Link>
            <PrintButton orderNo={order.poNo} />
          </div>
        }
      />
      <PoEditForm
        id={order.id}
        supplierId={order.supplierId}
        status={order.status}
        expectedDate={order.expectedDate ? order.expectedDate.toISOString().slice(0, 10) : ""}
        suppliers={[{ id: supplier?.id ?? order.supplierId, name: supplier?.name ?? "—" }]}
        items={items.map((i) => ({
          id: i.id, description: i.description, qty: i.qty, receivedQty: i.receivedQty,
          price: i.unitPriceCents / 100,
        }))}
        total={order.totalCents / 100}
      />
    </>
  );
}
