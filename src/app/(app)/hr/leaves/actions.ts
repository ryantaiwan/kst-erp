"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leaveRequests } from "@/db/schema";
import { parseDate } from "@/lib/hr";

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createLeaveRequest(formData: FormData) {
  const employeeId = str(formData, "employeeId");
  const type = str(formData, "type");
  const startDate = parseDate(str(formData, "startDate"));
  const endDate = parseDate(str(formData, "endDate"));
  if (!employeeId || !type || !startDate || !endDate) {
    throw new Error("員工、假別、起日與迄日為必填");
  }
  if (endDate.getTime() < startDate.getTime()) {
    throw new Error("迄日不可早於起日");
  }

  await db.insert(leaveRequests).values({
    employeeId,
    type,
    startDate,
    endDate,
    hours: Number(str(formData, "hours") ?? 0),
    reason: str(formData, "reason") || null,
  });

  revalidatePath("/hr/leaves");
}

export async function approveLeave(id: string, approved: boolean) {
  await db
    .update(leaveRequests)
    .set({
      status: approved ? "approved" : "rejected",
      approvedBy: "admin",
      approvedAt: new Date(),
    })
    .where(eq(leaveRequests.id, id));
  revalidatePath("/hr/leaves");
}

export async function cancelLeave(id: string) {
  await db.update(leaveRequests).set({ status: "cancelled" }).where(eq(leaveRequests.id, id));
  revalidatePath("/hr/leaves");
}
