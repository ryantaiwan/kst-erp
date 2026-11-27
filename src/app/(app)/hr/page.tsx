import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getHrSummary } from "@/lib/hr";
import { formatMoney } from "@/lib/utils";

export const instant = false;

const LINKS = [
  { href: "/hr/employees", label: "員工管理", desc: "員工主檔、到職日、薪資與狀態" },
  { href: "/hr/departments", label: "部門管理", desc: "組織架構與上級部門" },
  { href: "/hr/attendance", label: "出勤紀錄", desc: "打卡、工作時數與加班" },
  { href: "/hr/leaves", label: "請假管理", desc: "假別申請與核准" },
];

export default async function HrHomePage() {
  const summary = await getHrSummary();

  return (
    <>
      <PageHeader title="人資模組" subtitle="選取下方功能進入 · 僅員工帳號可見" />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card label="員工總數" value={`${summary.employeeCount}`} sub={`在職 ${summary.activeCount}`} />
        <Card label="月薪總額" value={formatMoney(summary.salaryCents)} sub="在職員工" />
        <Card label="出勤紀錄" value={`${summary.attendanceCount}`} sub={`加班 ${summary.overtimeHours} h`} />
        <Card label="待審核請假" value={`${summary.pendingLeaves ?? 0}`} sub={`已核准 ${summary.approvedLeaveHours ?? 0} h`} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-xl border border-[#e9e6f3] bg-white p-5 transition hover:border-[#6d4aff] hover:shadow-sm"
          >
            <div className="text-sm font-semibold text-[#5538d6]">{l.label} →</div>
            <div className="mt-1 text-xs text-[#9b96b0]">{l.desc}</div>
          </Link>
        ))}
      </div>
    </>
  );
}

function Card({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-[#e9e6f3] bg-white p-4">
      <div className="text-[11px] text-[#9b96b0]">{label}</div>
      <div className="mt-1 text-lg font-semibold text-[#26223d]">{value}</div>
      <div className="mt-1 text-[10px] text-[#9b96b0]">{sub}</div>
    </div>
  );
}
