import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { attendanceRecords, departments, employees, leaveRequests } from "@/db/schema";

/** 人資模組共用工具（唯讀資料層，不含 revalidatePath） */

/** 將 YYYY-MM-DD 轉為 UTC 零點的 Date，供表單輸入使用 */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** YYYY-MM-DD → Date（該日 00:00 UTC） */
export function dateOnly(value: string): Date | null {
  return parseDate(value);
}

export async function getDepartments() {
  return db.select().from(departments).orderBy(departments.code);
}

export async function getEmployees(limit = 200) {
  return db.select().from(employees).orderBy(desc(employees.status), employees.employeeNo).limit(limit);
}

export async function getAttendance(limit = 200) {
  return db
    .select({
      record: attendanceRecords,
      employeeName: employees.name,
      employeeNo: employees.employeeNo,
    })
    .from(attendanceRecords)
    .innerJoin(employees, eq(attendanceRecords.employeeId, employees.id))
    .orderBy(desc(attendanceRecords.date))
    .limit(limit);
}

export async function getLeaveRequests(limit = 200) {
  return db
    .select({
      request: leaveRequests,
      employeeName: employees.name,
      employeeNo: employees.employeeNo,
    })
    .from(leaveRequests)
    .innerJoin(employees, eq(leaveRequests.employeeId, employees.id))
    .orderBy(desc(leaveRequests.startDate))
    .limit(limit);
}

export async function getHrSummary() {
  const [emp] = await db
    .select({
      count: sql<number>`count(*)`,
      active: sql<number>`sum(case when ${employees.status} = 'active' then 1 else 0 end)`,
      salaryCents: sql<number>`coalesce(sum(case when ${employees.status} = 'active' then ${employees.salaryCents} else 0 end), 0)`,
    })
    .from(employees);

  const [att] = await db
    .select({
      count: sql<number>`count(*)`,
      hours: sql<number>`coalesce(sum(${attendanceRecords.hours}), 0)`,
      overtime: sql<number>`coalesce(sum(${attendanceRecords.overtimeHours}), 0)`,
    })
    .from(attendanceRecords);

  const [leave] = await db
    .select({
      pending: sql<number>`sum(case when ${leaveRequests.status} = 'pending' then 1 else 0 end)`,
      hours: sql<number>`coalesce(sum(case when ${leaveRequests.status} = 'approved' then ${leaveRequests.hours} else 0 end), 0)`,
    })
    .from(leaveRequests);

  return {
    employeeCount: emp?.count ?? 0,
    activeCount: emp?.active ?? 0,
    salaryCents: emp?.salaryCents ?? 0,
    attendanceCount: att?.count ?? 0,
    attendanceHours: att?.hours ?? 0,
    overtimeHours: att?.overtime ?? 0,
    pendingLeaves: leave?.pending ?? 0,
    approvedLeaveHours: leave?.hours ?? 0,
  };
}

/** 取得部門名稱對照表（給表格顯示用） */
export async function getDepartmentNameMap() {
  const rows = await getDepartments();
  return new Map(rows.map((d) => [d.id, d.name]));
}
