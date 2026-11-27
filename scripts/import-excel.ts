import { config } from "dotenv";
config({ path: ".env.local" });

import ExcelJS from "exceljs";
import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import * as s from "../src/db/schema";

const BASE = "C:/Users/profe/Desktop/進銷存開發";
const FILES = {
  master: path.join(BASE, "鋒冠科技 - 客戶部品處理表 匯入用.xlsx"),
  invoice: path.join(BASE, "鋒冠科技 - 發票記錄表 參考用.xlsx"),
};

const warnings: string[] = [];
const counts: Record<string, number> = {
  customers: 0,
  customerContacts: 0,
  suppliers: 0,
  products: 0,
  invoices: 0,
  profitRecords: 0,
  skippedInvoices: 0,
  skippedVoid: 0,
  skippedProfit: 0,
  removedInvalidInvoices: 0,
};

function text(v: ExcelJS.CellValue | null | undefined): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object" && "richText" in v) {
    return (v.richText ?? []).map((t: { text?: string }) => t.text ?? "").join("").trim();
  }
  return String(v);
}

function money(v: ExcelJS.CellValue | null | undefined): number {
  const n = Number(text(v).replace(/[,\sNT$]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/**
 * 讀取儲存格數值，含 ExcelJS 的公式物件 { formula, result }。
 * 利潤計算表的公司留/自己/USER/伙伴欄位多為公式，若只用 money()
 * 會把公式物件當成 0，導致業務分潤與盈餘分配全部流失。
 */
function moneyFromCell(v: ExcelJS.CellValue | null | undefined): number {
  if (v && typeof v === "object" && "result" in v) {
    const raw = (v as { result: unknown }).result;
    if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw * 100);
    if (raw === "" || raw === null || raw === undefined) return 0;
    return money(raw as ExcelJS.CellValue);
  }
  return money(v);
}

function excelDate(v: ExcelJS.CellValue | null | undefined): Date | null {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date) return v;
  const n = typeof v === "number" ? v : Number(text(v));
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n > 2958465) return null;
  return new Date(Date.UTC(1899, 11, 30) + Math.round(n) * 86_400_000);
}

function warn(msg: string) {
  if (warnings.length < 200) warnings.push(msg);
}

function validInvoiceNo(no: string) {
  return /^[A-Za-z]{2}\d{8}$/.test(no);
}

async function main() {
  const master = new ExcelJS.Workbook();
  await master.xlsx.readFile(FILES.master);
  const invoiceBook = new ExcelJS.Workbook();
  await invoiceBook.xlsx.readFile(FILES.invoice);

  /* ---------- 客户与联系人 ---------- */
  const customerMap = new Map<string, string>();
  for (const sheetName of ["銷售", "維修"]) {
    const ws = master.getWorksheet(sheetName);
    if (!ws) continue;
    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const name = text(row.getCell(2).value);
      if (!name || name === "客戶名稱") return;
      const contact = text(row.getCell(3).value);
      if (!customerMap.has(name)) customerMap.set(name, contact);
      else if (!customerMap.get(name) && contact) customerMap.set(name, contact);
    });
  }
  const allContacts = await db.select().from(s.customerContacts);
  const contactSeen = new Set<string>();
  for (const c of allContacts) {
    const key = `${c.customerId}|${c.name}`;
    if (contactSeen.has(key)) {
      await db.delete(s.customerContacts).where(eq(s.customerContacts.id, c.id));
    } else {
      contactSeen.add(key);
    }
  }

  for (const [name, contact] of customerMap) {
    await db.insert(s.customers).values({ code: `C-${name}`, name }).onConflictDoNothing();
    counts.customers += 1;
    if (contact) {
      const [found] = await db.select().from(s.customers).where(eq(s.customers.name, name)).limit(1);
      const key = `${found?.id}|${contact}`;
      if (found && !contactSeen.has(key)) {
        await db.insert(s.customerContacts).values({ customerId: found.id, name: contact, isPrimary: true }).onConflictDoNothing();
        contactSeen.add(key);
        counts.customerContacts += 1;
      }
    }
  }

  /* ---------- 供应商（来自发票进项） ---------- */
  const supplierMap = new Map<string, string>();
  for (const ws of invoiceBook.worksheets) {
    if (!ws.name.endsWith("發票記錄")) continue;
    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const name = text(row.getCell(8).value);
      if (!name || name === "進項發票開立公司" || name === "作廢") return;
      if (!supplierMap.has(name)) supplierMap.set(name, name);
    });
  }
  for (const [name, code] of supplierMap) {
    await db.insert(s.suppliers).values({ code: `S-${code}`, name }).onConflictDoNothing();
    counts.suppliers += 1;
  }
  const supplierRows = await db.select().from(s.suppliers);
  const supplierIdByName = new Map(supplierRows.map((r) => [r.name, r.id]));
  const customerRows = await db.select().from(s.customers);
  const customerIdByName = new Map(customerRows.map((r) => [r.name, r.id]));

  /* ---------- 商品/部品 ---------- */
  const productMap = new Map<string, string>();
  const collectProduct = (sku: string, name: string, source: string) => {
    if (!sku || !name) return;
    if (/\[\d+\/\d+\]/.test(name)) warn(`${source}: 品項含拆行標記 ${name}`);
    if (!productMap.has(sku)) productMap.set(sku, name);
  };
  const detailRepair = master.getWorksheet("維修明細(L6AH2)");
  detailRepair?.eachRow((row, n) => {
    if (n === 1) return;
    collectProduct(text(row.getCell(6).value) || text(row.getCell(7).value), text(row.getCell(9).value), "維修明細");
  });
  const detailSales = master.getWorksheet("銷售明細 (L6AH2)");
  detailSales?.eachRow((row, n) => {
    if (n === 1) return;
    collectProduct(text(row.getCell(4).value), text(row.getCell(5).value), "銷售明細");
  });
  for (const [sku, name] of productMap) {
    await db.insert(s.products).values({ sku, name, unit: "顆", costCents: 0, salePriceCents: 0 }).onConflictDoNothing();
    counts.products += 1;
  }

  /* ---------- 发票 ---------- */
  const allInvoices = await db.select({ id: s.invoices.id, no: s.invoices.invoiceNo }).from(s.invoices);
  for (const inv of allInvoices) {
    if (!validInvoiceNo(inv.no)) {
      await db.delete(s.invoices).where(eq(s.invoices.id, inv.id));
      counts.removedInvalidInvoices += 1;
    }
  }
  const existingInvoices = new Set(
    (await db.select({ no: s.invoices.invoiceNo }).from(s.invoices)).map((r) => r.no),
  );
  const pending: Promise<void>[] = [];
  for (const ws of invoiceBook.worksheets) {
    if (!ws.name.endsWith("發票記錄")) continue;
    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const handle = async (type: "output" | "input", partyName: string, date: Date | null, no: string, amount: number, tax: number, paid: string, payDate: Date | null) => {
        if (!no || !validInvoiceNo(no)) return;
        if (partyName === "作廢" || amount === 0) {
          counts.skippedVoid += 1;
          return;
        }
        if (existingInvoices.has(no)) {
          counts.skippedInvoices += 1;
          return;
        }
        if (!date) warn(`${ws.name} 列${rowNumber}: 發票 ${no} 日期無效`);
        const partyId = type === "output" ? customerIdByName.get(partyName) : supplierIdByName.get(partyName);
        const status = partyName === "作廢" ? "void" : type === "input" && paid === "v" ? "paid" : type === "input" ? "待付款" : "已開立";
        await db.insert(s.invoices).values({
          invoiceNo: no,
          type,
          partyId,
          invoiceDate: date ?? new Date(Date.UTC(2026, 0, 1)),
          amountCents: amount,
          taxCents: tax,
          status,
          paidAt: payDate,
        }).onConflictDoNothing();
        existingInvoices.add(no);
        counts.invoices += 1;
      };

      const outParty = text(row.getCell(1).value);
      const outDate = excelDate(row.getCell(3).value);
      const outNo = text(row.getCell(4).value);
      const outAmount = money(row.getCell(5).value);
      const outTax = money(row.getCell(6).value);
      if (outNo || outParty) {
        pending.push(handle("output", outParty, outDate, outNo, outAmount, outTax, "", null));
      }

      const inParty = text(row.getCell(8).value);
      const inDate = excelDate(row.getCell(9).value);
      const inNo = text(row.getCell(10).value);
      const inAmount = money(row.getCell(11).value);
      const inTax = money(row.getCell(12).value);
      const paid = text(row.getCell(14).value);
      const payDate = excelDate(row.getCell(15).value);
      if (inNo || inParty) {
        pending.push(handle("input", inParty, inDate, inNo, inAmount, inTax, paid, payDate));
      }
    });
  }

  await Promise.all(pending);

  /* ---------- 利润计算表 ---------- */
  const existingProfit = new Set(
    (await db.select({ sourceId: s.profitRecords.sourceId }).from(s.profitRecords).where(eq(s.profitRecords.sourceType, "profit"))).map((r) => r.sourceId),
  );
  const profitPending: Promise<unknown>[] = [];
  const profitWs = master.getWorksheet("利潤計算表");
  profitWs?.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const invoiceNo = text(row.getCell(4).value);
    const description = text(row.getCell(1).value);
    if (!invoiceNo || invoiceNo === "發票號碼") return;
    const sourceId = `${invoiceNo}-${rowNumber}`;
    if (existingProfit.has(sourceId)) {
      counts.skippedProfit += 1;
      return;
    }
    const revenue = moneyFromCell(row.getCell(5).value);
    const cost = moneyFromCell(row.getCell(13).value);
    const companyBase = moneyFromCell(row.getCell(16).value);
    const self = moneyFromCell(row.getCell(17).value);
    const user = moneyFromCell(row.getCell(18).value);
    const partner = moneyFromCell(row.getCell(19).value);
    const profit = revenue - cost;
    const salespersonPercent = profit > 0 ? Math.round((user / profit) * 100) : 0;
    if (/\[\d+\/\d+\]/.test(description)) warn(`利潤計算表 列${rowNumber}: 拆行品項 ${description}`);
    if (profit < 0) warn(`利潤計算表 列${rowNumber}: 利潤為負 ${description}`);

    profitPending.push(db.insert(s.profitRecords).values({
      sourceType: "profit",
      sourceId,
      revenueCents: revenue,
      costCents: cost,
      profitCents: profit,
      companyBaseCents: companyBase,
      salespersonPercent,
      salespersonCents: user,
      companyRemainderCents: self + partner,
      taxRateSnapshot: 500,
    }).onConflictDoNothing());
    existingProfit.add(sourceId);
    counts.profitRecords += 1;
  });

  await Promise.all(profitPending);

  const report = [
    "# Excel 导入报告",
    "",
    `来源：${FILES.master}`,
    `来源：${FILES.invoice}`,
    "",
    "## 导入笔数",
    ...Object.entries(counts).map(([k, v]) => `- ${k}: ${v}`),
    "",
    "## 警告（最多 200 则）",
    ...(warnings.length ? warnings.map((w) => `- ${w}`) : ["- 无"]),
    "",
  ].join("\n");
  fs.writeFileSync(path.join(process.cwd(), "IMPORT-REPORT.md"), report, "utf8");
  console.log("Import completed.");
  console.log(counts);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
