import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { formatDate, formatMoney } from "@/lib/utils";
import { getSalesOrderDetail } from "@/actions/orders";
import { OrderEditForm } from "./order-edit-form";
import { PrintButton } from "./print-button";

export const instant = false;

export default async function SalesOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getSalesOrderDetail(id);
  if (!detail) notFound();
  const { order, customer, items, products } = detail;

  return (
    <>
      <PageHeader
        title={`銷貨訂單 ${order.soNo}`}
        subtitle={`${customer?.name ?? "—"} · 建立日 ${formatDate(order.createdAt)}`}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/sales/orders" className="rounded-lg border border-[#e9e6f3] bg-white px-3 py-2 text-xs text-[#57536e] no-underline">返回列表</Link>
            <PrintButton orderNo={order.soNo} />
          </div>
        }
      />
      <OrderEditForm
        id={order.id}
        customerId={order.customerId}
        status={order.status}
        expectedShipDate={order.expectedShipDate ? order.expectedShipDate.toISOString().slice(0, 10) : ""}
        customers={[{ id: customer?.id ?? order.customerId, name: customer?.name ?? "—" }]}
        products={products}
        items={items.map((i) => ({
          id: i.id, description: i.description, qty: i.qty, shippedQty: i.shippedQty,
          price: i.priceCents / 100, subtotal: i.subtotalCents / 100,
        }))}
        totals={{ subtotal: order.subtotalCents / 100, tax: order.taxCents / 100, total: order.totalCents / 100 }}
      />
    </>
  );
}
