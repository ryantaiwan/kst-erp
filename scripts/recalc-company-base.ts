import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@libsql/client";

/**
 * 將公司基本留比例改為 10%，並重算所有歷史利潤紀錄的分配。
 * 公式：公司留 = 利潤 × 10%；公司剩餘 = 利潤 − 公司留 − 業務分潤。
 * 業務分潤（salespersonCents / salespersonPercent）維持不變。
 *
 * 直接用 @libsql/client 連線，避免 drizzle db 模組在 dotenv 載入前被 import
 * 而誤連到本機 local.db。
 */
const NEW_PERCENT = 10;

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const rule = await client.execute("select id from profit_rule order by effective_date desc limit 1");
  if (rule.rows.length) {
    await client.execute({
      sql: "update profit_rule set company_base_percent = ?, note = ? where id = ?",
      args: [NEW_PERCENT, "公司基本留 10%，業務% 以利益為基數，剩餘回公司", String(rule.rows[0].id)],
    });
  } else {
    await client.execute({
      sql: "insert into profit_rule (id, company_base_percent, effective_date, note) values (?,?,?,?)",
      args: [crypto.randomUUID(), NEW_PERCENT, Math.floor(Date.now() / 1000), "公司基本留 10%，業務% 以利益為基數，剩餘回公司"],
    });
  }
  console.log("已更新分潤規則：", NEW_PERCENT, "%");

  const rows = await client.execute("select id, profit_cents, salesperson_cents from profit_record");
  const batch = rows.rows.map((r) => ({
    sql: "update profit_record set company_base_cents = ?, company_remainder_cents = ? where id = ?",
    args: [
      Math.round(Number(r.profit_cents) * NEW_PERCENT / 100),
      Number(r.profit_cents) - Math.round(Number(r.profit_cents) * NEW_PERCENT / 100) - Number(r.salesperson_cents),
      String(r.id),
    ],
  }));

  for (let i = 0; i < batch.length; i += 100) {
    await client.batch(batch.slice(i, i + 100), "write");
  }
  console.log("已重算利潤紀錄：", rows.rows.length, "筆");
}

main().catch((e) => { console.error(e); process.exit(1); });
