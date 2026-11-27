import { PageHeader } from "@/components/page-header";
import { SimpleTable } from "@/components/simple-table";
import { formatDate } from "@/lib/utils";
import { getEmployees, getHrSummary, getLeaveRequests } from "@/lib/hr";
import { LeaveForm } from "./leave-form";
import { LeaveActions } from "./leave-actions";

export const instant = false;

const STATUS_LABEL: Record<string, string> = {
  pending: "待審核",
  approved: "已核准",
  rejected: "已駁回",
  cancelled: "已取消",
};

export default async function LeavesPage() {
  const [rows, employees, summary] = await Promise.all([getLeaveRequests(), getEmployees(), getHrSummary()]);

  return (
    <>
      <PageHeader
        title="請假管理"
        subtitle="假別申請與審核 · 核准後時數計入統計"
        right={
          <div className="flex gap-2">
            <div className="rounded-lg border border-[#e9e6f3] bg-white px-3 py-2">
              <div className="text-[10px] text-[#9b96b0]">待審核</div>
              <div className="text-sm font-semibold text-[#e05a5a]">{summary.pendingLeaves ?? 0} 筆</div>
            </div>
            <div className="rounded-lg border border-[#e9e6f3] bg-white px-3 py-2">
              <div className="text-[10px] text-[#9b96b0]">已核准時數</div>
              <div className="text-sm font-semibold text-[#5538d6]">{summary.approvedLeaveHours ?? 0} h</div>
            </div>
          </div>
        }
      />
      <LeaveForm employees={employees.map((e) => ({ id: e.id, name: e.name, employeeNo: e.employeeNo }))} />
      <div className="mt-6">
        <SimpleTable
          rows={rows}
          empty="尚無請假紀錄"
          columns={[
            { key: "emp", label: "員工", render: (r) => <span className="font-medium">{r.employeeName}</span> },
            { key: "type", label: "假別", render: (r) => r.request.type },
            { key: "start", label: "起日", render: (r) => formatDate(r.request.startDate) },
            { key: "end", label: "迄日", render: (r) => formatDate(r.request.endDate) },
            { key: "hours", label: "時數", render: (r) => `${r.request.hours} h` },
            { key: "reason", label: "事由", render: (r) => r.request.reason ?? "—" },
            {
              key: "status",
              label: "狀態",
              render: (r) => {
                const s = r.request.status;
                const tone = s === "approved" ? "text-[#0d8a45]" : s === "rejected" ? "text-[#e05a5a]" : "text-[#9b96b0]";
                return <span className={tone}>{STATUS_LABEL[s] ?? s}</span>;
              },
            },
            {
              key: "action",
              label: "作業",
              render: (r) => <LeaveActions id={r.request.id} status={r.request.status} />,
            },
          ]}
        />
      </div>
    </>
  );
}
