"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { attendanceRecords } from "@/db/schema";
import { parseDate } from "@/lib/hr";

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createAttendance(formData: FormData) {
  const employeeId = str(formData, "employeeId");
  const date = parseDate(str(formData, "date"));
  if (!employeeId || !date) throw new Error("員工與日期為必填");

  await db.insert(attendanceRecords).values({
    employeeId,
    date,
    type: str(formData, "type") || "normal",
    checkIn: str(formData, "checkIn") || null,
    checkOut: str(formData, "checkOut") || null,
    hours: Number(str(formData, "hours") ?? 0),
    overtimeHours: Number(str(formData, "overtimeHours") ?? 0),
    note: str(formData, "note") || null,
  });

  revalidatePath("/hr/attendance");
}

export async function deleteAttendance(id: string) {
  await db.delete(attendanceRecords).where(eq(attendanceRecords.id, id));
  revalidatePath("/hr/attendance");
}
