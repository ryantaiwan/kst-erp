import { PageHeader } from "@/components/page-header";
import { SimpleTable } from "@/components/simple-table";
import { formatDate } from "@/lib/utils";
import { getAttendance, getEmployees, getHrSummary } from "@/lib/hr";
import { AttendanceForm } from "./attendance-form";

export const instant = false;

const TYPE_LABEL: Record<string, string> = {
  normal: "正常",
  late: "遲到",
  early_leave: "早退",
  absent: "曠職",
  business_trip: "出差",
  holiday_work: "假日加班",
};

export default async function AttendancePage() {
  const [rows, employees, summary] = await Promise.all([getAttendance(), getEmployees(), getHrSummary()]);

  return (
    <>
      <PageHeader
        title="出勤紀錄"
        subtitle="打卡、工作時數與加班紀錄"
        right={
          <div className="flex gap-2">
            <Stat label="紀錄筆數" value={`${summary.attendanceCount}`} />
            <Stat label="總工作時數" value={`${summary.attendanceHours} h`} />
            <Stat label="總加班時數" value={`${summary.overtimeHours} h`} />
          </div>
        }
      />
      <AttendanceForm employees={employees.map((e) => ({ id: e.id, name: e.name, employeeNo: e.employeeNo }))} />
      <div className="mt-6">
        <SimpleTable
          rows={rows}
          empty="尚無出勤紀錄"
          columns={[
            { key: "date", label: "日期", render: (r) => formatDate(r.record.date) },
            { key: "emp", label: "員工", render: (r) => <span className="font-medium">{r.employeeName}</span> },
            { key: "no", label: "員工編號", render: (r) => r.employeeNo },
            { key: "type", label: "狀態", render: (r) => TYPE_LABEL[r.record.type] ?? r.record.type },
            { key: "in", label: "上班", render: (r) => r.record.checkIn ?? "—" },
            { key: "out", label: "下班", render: (r) => r.record.checkOut ?? "—" },
            { key: "hours", label: "時數", render: (r) => `${r.record.hours} h` },
            { key: "ot", label: "加班", render: (r) => (r.record.overtimeHours > 0 ? <span className="text-[#5538d6]">{r.record.overtimeHours} h</span> : "—") },
            { key: "note", label: "備註", render: (r) => r.record.note ?? "—" },
          ]}
        />
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e9e6f3] bg-white px-3 py-2">
      <div className="text-[10px] text-[#9b96b0]">{label}</div>
      <div className="text-sm font-semibold text-[#26223d]">{value}</div>
    </div>
  );
}
