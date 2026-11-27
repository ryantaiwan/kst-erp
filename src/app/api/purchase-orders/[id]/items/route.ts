import { eq } from "drizzle-orm";
import { db } from "@/db";
import { purchaseOrderItems } from "@/db/schema";

export const instant = false;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.orderId, id));
  return Response.json(rows.map((r) => ({
    id: r.id, description: r.description, qty: r.qty, receivedQty: r.receivedQty,
  })));
}
