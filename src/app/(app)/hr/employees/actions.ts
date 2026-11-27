"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { parseDate } from "@/lib/hr";

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createEmployee(formData: FormData) {
  const employeeNo = str(formData, "employeeNo");
  const name = str(formData, "name");
  const hireDate = parseDate(str(formData, "hireDate"));
  if (!employeeNo || !name || !hireDate) {
    throw new Error("員工編號、姓名與到職日為必填");
  }

  await db.insert(employees).values({
    employeeNo,
    name,
    departmentId: str(formData, "departmentId") || null,
    title: str(formData, "title") || null,
    email: str(formData, "email") || null,
    phone: str(formData, "phone") || null,
    nationalId: str(formData, "nationalId") || null,
    birthDate: parseDate(str(formData, "birthDate")),
    hireDate,
    salaryCents: Math.round(Number(str(formData, "salary")) * 100),
    note: str(formData, "note") || null,
  });

  revalidatePath("/hr/employees");
  revalidatePath("/hr/departments");
}

export async function updateEmployeeStatus(id: string, status: string) {
  if (!["active", "on_leave", "resigned"].includes(status)) {
    throw new Error("無效的員工狀態");
  }
  await db
    .update(employees)
    .set({ status, leaveDate: status === "resigned" ? new Date() : null })
    .where(eq(employees.id, id));
  revalidatePath("/hr/employees");
}
