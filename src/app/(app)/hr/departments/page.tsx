import { PageHeader } from "@/components/page-header";
import { SimpleTable } from "@/components/simple-table";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { getDepartments } from "@/lib/hr";
import { createDepartment } from "./actions";
import { DepartmentForm } from "./department-form";

export const instant = false;

export default async function DepartmentsPage() {
  const [rows, empRows] = await Promise.all([getDepartments(), db.select({ id: employees.id, departmentId: employees.departmentId }).from(employees)]);
  const countMap = new Map<string, number>();
  for (const e of empRows) {
    if (e.departmentId) countMap.set(e.departmentId, (countMap.get(e.departmentId) ?? 0) + 1);
  }
  const nameMap = new Map(rows.map((d) => [d.id, d.name]));

  return (
    <>
      <PageHeader title="部門管理" subtitle="組織架構與部門代號 · 可設定上級部門" />
      <DepartmentForm />
      <div className="mt-6">
        <SimpleTable
          rows={rows}
          empty="尚無部門資料，請先新增"
          columns={[
            { key: "code", label: "代號", render: (r) => <span className="font-medium text-[#5538d6]">{r.code}</span> },
            { key: "name", label: "部門名稱", render: (r) => <span className="font-medium">{r.name}</span> },
            { key: "parent", label: "上級部門", render: (r) => (r.parentId ? nameMap.get(r.parentId) ?? "—" : "—") },
            { key: "count", label: "員工人數", render: (r) => countMap.get(r.id) ?? 0 },
            { key: "note", label: "備註", render: (r) => r.note ?? "—" },
          ]}
        />
      </div>
    </>
  );
}
