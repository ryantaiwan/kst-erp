import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, products, salesOrders } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { SimpleTable } from "@/components/simple-table";
import { SimplePagination } from "@/components/simple-pagination";
import { formatDate, formatMoney } from "@/lib/utils";
import { getCurrentScope } from "@/lib/scope";
import { OrderStatusEditor } from "./order-actions";
import { SalesOrderForm } from "./order-form";

export const instant = false;

export default async function SalesOrdersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const scope = await getCurrentScope();
  const where = scope.filtered ? eq(salesOrders.customerId, scope.scopeId!) : undefined;

  const [rows, countRows, customerRows, productRows] = await Promise.all([
    db.select().from(salesOrders).where(where)
      .orderBy(desc(salesOrders.createdAt)).limit(20).offset((page - 1) * 20),
    db.select({ n: sql<number>`count(*)` }).from(salesOrders).where(where),
    db.select().from(customers),
    db.select({ id: products.id, sku: products.sku, name: products.name }).from(products),
  ]);
  const customerNameById = new Map(customerRows.map((c) => [c.id, c.name]));

  return (
    <>
      <PageHeader title="銷貨訂單" subtitle="新增訂單時自動抓取目前系統稅率 · 點擊訂單號可查看與編輯" />
      <SalesOrderForm customers={customerRows.map((c) => ({ id: c.id, name: c.name }))} products={productRows} />

      <SimplePagination page={page} total={countRows[0]?.n ?? 0} basePath="/sales/orders" />
      <SimpleTable
        rows={rows}
        empty="尚無銷貨訂單，請用上方表單新增"
        columns={[
          {
            key: "no",
            label: "訂單號",
            render: (r) => (
              <Link href={`/sales/orders/${r.id}`} className="font-medium text-[#5538d6] no-underline hover:underline">
                {r.soNo}
              </Link>
            ),
          },
          { key: "customer", label: "客戶", render: (r) => customerNameById.get(r.customerId) ?? r.customerId.slice(0, 8) },
          { key: "date", label: "建立日", render: (r) => formatDate(r.createdAt) },
          { key: "subtotal", label: "未稅", render: (r) => formatMoney(r.subtotalCents) },
          { key: "tax", label: "稅金", render: (r) => formatMoney(r.taxCents) },
          { key: "total", label: "總計", render: (r) => formatMoney(r.totalCents) },
          { key: "status", label: "狀態", render: (r) => <OrderStatusEditor id={r.id} status={r.status} /> },
        ]}
      />
    </>
  );
}
