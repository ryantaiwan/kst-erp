import { eq } from "drizzle-orm";
import { db } from "@/db";
import { shipmentItems } from "@/db/schema";

export const instant = false;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(shipmentItems).where(eq(shipmentItems.shipmentId, id));
  return Response.json(rows.map((r) => ({
    id: r.id, description: r.description, qty: r.qty, releaseNo: r.releaseNo, serialNo: r.serialNo,
  })));
}
