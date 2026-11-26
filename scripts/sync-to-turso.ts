import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@libsql/client";
import fs from "node:fs";

/**
 * 把本機 local.db 的正式資料同步到遠端 Turso。
 * 用途：Excel 匯入與本機測試先寫入 local.db，確認無誤後再搬到正式庫。
 * 採「來源表為準」的全量覆寫，先清空目標表再寫入，避免重複。
 */

const LOCAL_URL = "file:./local.db";

const TABLES = [
  "customer",
  "customer_contact",
  "supplier",
  "supplier_contact",
  "product",
  "invoice",
  "invoice_item",
  "profit_record",
  "role",
  "role_permission",
  "feature_visibility",
  "tax_setting",
  "profit_rule",
  "system_setting",
  "warehouse",
  "user",
  "account",
  "session",
];

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || url.startsWith("file:")) {
    throw new Error("請確認 .env.local 已設定遠端 TURSO_DATABASE_URL 與 TURSO_AUTH_TOKEN");
  }
  if (!fs.existsSync("local.db")) {
    throw new Error("找不到 local.db，請先執行 Excel 匯入");
  }

  const local = createClient({ url: LOCAL_URL });
  const remote = createClient({ url, authToken });

  const total = { copied: 0, skipped: 0 };

  for (const table of TABLES) {
    const check = await remote.execute(
      `select name from sqlite_master where type='table' and name=?`,
      [table],
    );
    if (check.rows.length === 0) {
      console.log(`  skip ${table}（遠端無此表）`);
      total.skipped += 1;
      continue;
    }

    const src = await local.execute(`select * from ${table}`);
    if (src.rows.length === 0) {
      console.log(`  skip ${table}（本機無資料）`);
      continue;
    }

    // 依遠端實際欄位過濾，避免欄位不一致
    const pragma = await remote.execute(`pragma table_info(${table})`);
    const remoteCols = new Set(pragma.rows.map((r) => String(r.name)));
    const cols = src.columns.filter((c) => remoteCols.has(c));
    if (cols.length === 0) {
      console.log(`  skip ${table}（欄位無交集）`);
      continue;
    }

    await remote.execute(`delete from ${table}`);

    const colList = cols.join(", ");
    const placeholders = cols.map(() => "?").join(", ");
    const stmt = `insert into ${table} (${colList}) values (${placeholders})`;

    const CHUNK = 100;
    for (let i = 0; i < src.rows.length; i += CHUNK) {
      const slice = src.rows.slice(i, i + CHUNK);
      const statements = slice.map((row) => ({
        sql: stmt,
        args: cols.map((c) => {
          const v = row[c];
          if (v === null || v === undefined) return null;
          if (typeof v === "boolean") return v ? 1 : 0;
          if (typeof v === "bigint") return Number(v);
          if (v instanceof Uint8Array) return Buffer.from(v);
          return v as string | number;
        }),
      }));
      await remote.batch(statements, "write");
    }

    console.log(`  ${table}: ${src.rows.length} 筆`);
    total.copied += src.rows.length;
  }

  console.log(`\n同步完成，共 ${total.copied} 筆寫入遠端 Turso。`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
