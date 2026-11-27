import { Eye, Pencil, LockKeyhole, ShieldCheck, Users } from "lucide-react";

/** 權限設定操作說明：讓管理者看懂兩張表各自控制什麼 */
export function PermissionGuide() {
  return (
    <div className="mb-6 grid gap-3 lg:grid-cols-2">
      <section className="rounded-xl border border-[#e0d8fa] bg-[#faf8ff] p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#5538d6]">
          <ShieldCheck size={16} />
          這頁在做什麼？
        </div>
        <p className="text-[12px] leading-6 text-[#57536e]">
          決定「誰能看到什麼功能」與「誰能修改資料」。兩張表<b>用途不同、都会立即生效</b>，設定後不用按儲存，改了就存。
        </p>
        <ul className="mt-2 space-y-1 text-[12px] leading-5 text-[#57536e]">
          <li>• <b>上半：角色權限矩陣</b> — 控制每個「角色」能不能讀、能不能寫。</li>
          <li>• <b>下半：功能可見範圍</b> — 控制「員工 / 客戶 / 廠商」三種帳號類型在左側選單看得到哪些功能。</li>
        </ul>
      </section>

      <section className="rounded-xl border border-[#e9e6f3] bg-white p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#26223d]">
          <Users size={16} />
          實際生效邏輯（重要）
        </div>
        <ol className="list-decimal space-y-1 pl-5 text-[12px] leading-5 text-[#57536e]">
          <li>先檢查<b>功能可見範圍</b>：設為「遮蔽」的功能，選單直接不顯示。</li>
          <li><b>員工</b>帳號預設看到全部功能，不受此表限制。</li>
          <li><b>客戶 / 廠商</b>帳號只能看到設定為可見的功能，且資料自動限縮為自己那一筆。</li>
          <li>角色權限的「讀 / 寫」目前是<b>記錄用</b>，寫入操作的強制檢查仍在陸續補上。</li>
        </ol>
      </section>

      <section className="rounded-xl border border-[#e9e6f3] bg-white p-4 lg:col-span-2">
        <div className="mb-3 text-sm font-semibold text-[#26223d]">四種可見程度怎麼選？</div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <LevelCard icon={<Pencil size={15} />} title="可讀寫" desc="選單顯示，可查看也可新增修改資料" />
          <LevelCard icon={<Eye size={15} />} title="唯讀" desc="選單顯示，只能看不能改" />
          <LevelCard icon={<Users size={15} />} title="可見（自身）" desc="只看到與自己相關的資料，看不到別人的" />
          <LevelCard icon={<LockKeyhole size={15} />} title="遮蔽" desc="選單完全不顯示這個功能" />
        </div>
        <p className="mt-3 rounded-lg bg-[#fbfaff] px-3 py-2 text-[11px] leading-5 text-[#8c88a6]">
          常見用法：給客戶「報價單 = 可見（自身）、應收帳款 = 可見（自身）」，其餘設為「遮蔽」；給廠商「詢價單 / 採購訂單 = 可見（自身）」，其餘遮蔽。
        </p>
      </section>
    </div>
  );
}

function LevelCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-[#f1eff7] bg-[#fcfbff] p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#5538d6]">
        {icon}
        {title}
      </div>
      <p className="text-[11px] leading-5 text-[#8c88a6]">{desc}</p>
    </div>
  );
}
