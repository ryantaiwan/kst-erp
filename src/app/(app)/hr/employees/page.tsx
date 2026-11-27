import { PageHeader } from "@/components/page-header";
import { SimpleTable } from "@/components/simple-table";
import { formatDate, formatMoney } from "@/lib/utils";
import { getDepartments, getEmployees } from "@/lib/hr";
import { createEmployee } from "./actions";
import { EmployeeForm } from "./employee-form";

export const instant = false;

const STATUS_LABEL: Record<string, string> = {
  active: "在職",
  on_leave: "留職停薪",
  resigned: "離職",
};

export default async function EmployeesPage() {
  const [rows, depts] = await Promise.all([getEmployees(), getDepartments()]);
  const deptMap = new Map(depts.map((d) => [d.id, d.name]));

  return (
    <>
      <PageHeader
        title="員工管理"
        subtitle="員工主檔 · 到職日、部門、薪資 · 與登入帳號可選配關聯"
      />
      <EmployeeForm departments={depts} />
      <div className="mt-6">
        <SimpleTable
          rows={rows}
          empty="尚無員工資料，請先新增"
          columns={[
            { key: "no", label: "員工編號", render: (r) => <span className="font-medium text-[#5538d6]">{r.employeeNo}</span> },
            { key: "name", label: "姓名", render: (r) => <span className="font-medium">{r.name}</span> },
            { key: "dept", label: "部門", render: (r) => (r.departmentId ? deptMap.get(r.departmentId) ?? "—" : "—") },
            { key: "title", label: "職稱", render: (r) => r.title ?? "—" },
            { key: "phone", label: "電話", render: (r) => r.phone ?? "—" },
            { key: "hire", label: "到職日", render: (r) => formatDate(r.hireDate) },
            { key: "salary", label: "月薪", render: (r) => formatMoney(r.salaryCents) },
            {
              key: "status",
              label: "狀態",
              render: (r) => (
                <span className={r.status === "active" ? "text-[#0d8a45]" : "text-[#9b96b0]"}>
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
              ),
            },
          ]}
        />
      </div>
    </>
  );
}
