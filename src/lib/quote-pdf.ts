import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { companyProfile } from "./company";

/**
 * 報價單 PDF 產生器。
 * 版式參考既有范本（AUO / 能匠 等）：
 *   抬頭公司資訊 → Quotation 標題 → 客戶與單據資訊 → 品項表格 → 備註 → 總計
 *
 * 中文字型以 Noto Sans TC（繁體）子集內嵌。
 * 注意：pdf-lib 的內建 subsetting 與 Noto CJK 不相容（會產生缺字），
 * 因此改為先用 fontkit 動態裁出實際用字，再以 subset:false 完整內嵌。
 */

const FONT_PATH = path.join(process.cwd(), "public", "fonts", "NotoSansTC-Regular-subset.ttf");

/** 快取已載入的字型來源物件（避免每次請求重��解析） */
let fontSource: any = null;

async function loadFontSource() {
  if (fontSource) return fontSource;
  const bytes = await fs.readFile(FONT_PATH);
  const font = fontkit.create(new Uint8Array(bytes));
  // fontkit 需先觸碰各表完成 lazy load，否則後續 subset 會失敗
  for (const table of ["glyf", "loca", "head", "hhea", "hmtx", "maxp", "cmap", "name", "post", "OS/2"]) {
    try {
      void (font as any)[table];
    } catch {
      /* 某些字型可能沒有其中部分表，忽略即可 */
    }
  }
  fontSource = font;
  return font;
}

/**
 * 依實際要寫入的文字動態裁切字型，回傳可安全內嵌的 TTF 位元組。
 * 若裁切失敗則回傳 null，由呼叫端改用完整字型。
 */
async function subsetFontFor(text: string): Promise<Uint8Array | null> {
  try {
    const font = await loadFontSource();
    const subset: any = font.createSubset();
    const seen = new Set<number>();

    for (const ch of text) {
      const cp = ch.codePointAt(0)!;
      if (cp < 0x20) continue;
      if (seen.has(cp)) continue;
      seen.add(cp);
      const glyph = font.glyphForCodePoint(cp);
      subset.includeGlyph(glyph);
    }

    return subset.encode();
  } catch {
    return null;
  }
}

const INK = rgb(0.15, 0.13, 0.24);
const MUTED = rgb(0.45, 0.43, 0.55);
const LINE = rgb(0.82, 0.8, 0.88);

export type QuotePdfItem = {
  lineNo: number;
  description: string;
  qty: number;
  unit: string;
  priceCents: number;
  subtotalCents: number;
};

export type QuotePdfData = {
  quoteNo: string;
  quoteDate: Date;
  validUntil: Date | null;
  customerName: string;
  contactName?: string | null;
  contactPhone?: string | null;
  customerTaxId?: string | null;
  customerAddress?: string | null;
  handler?: string | null;
  taxRateBasisPoints: number;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  items: QuotePdfItem[];
  note?: string | null;
};

function money(cents: number) {
  return (cents / 100).toLocaleString("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function roc(date: Date) {
  return date.getUTCFullYear() - 1911;
}

function rocDate(date: Date) {
  return `${roc(date)}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${String(date.getUTCDate()).padStart(2, "0")}`;
}

/** 收集 PDF 上會出現的所有文字，供字型裁切使用 */
function collectAllText(data: QuotePdfData) {
  const parts: string[] = [
    companyProfile.nameZh,
    companyProfile.nameEn,
    companyProfile.tel,
    companyProfile.fax,
    companyProfile.address,
    companyProfile.website,
    companyProfile.email,
    companyProfile.handler,
    "Quotation",
    data.quoteNo,
    data.customerName ?? "",
    data.contactName ?? "",
    data.contactPhone ?? "",
    data.customerTaxId ?? "",
    data.customerAddress ?? "",
    data.handler ?? "",
    "客戶名稱",
    "聯絡人",
    "聯絡電話",
    "統編",
    "報價單號",
    "報價日期",
    "報價更新日期",
    "有效期限",
    "經辦人",
    "項目",
    "品名 / 型號 / 規格 / 說明 / 序號",
    "數量",
    "單位",
    "單價",
    "小計",
    "小計 (未稅, NTD)",
    "稅金",
    "合計 (含稅, NTD)",
    "備註",
    rocDate(data.quoteDate),
    data.validUntil ? rocDate(data.validUntil) : "",
    `(${data.taxRateBasisPoints / 100})`,
  ];

  for (const item of data.items) {
    parts.push(item.description, String(item.qty), item.unit, money(item.priceCents), money(item.subtotalCents));
  }

  parts.push(money(data.subtotalCents), money(data.taxCents), money(data.totalCents));

  const notes = (data.note ?? "").split("\n").filter(Boolean);
  if (notes.length) parts.push(...notes);

  // 數字與英文字母
  parts.push("0123456789.,()-/%NT$: ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz");

  return parts.join("");
}

export async function generateQuotePdf(data: QuotePdfData) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const allText = collectAllText(data);
  const subsetBytes = await subsetFontFor(allText);
  const font = await doc.embedFont(subsetBytes ?? (await fs.readFile(FONT_PATH)), { subset: false });

  const page = doc.addPage([595.28, 841.89]); // A4
  const W = 595.28;
  const M = 40;
  let y = 800;

  // 抬頭（固定區塊，不影響下方版面流）
  const headTop = 800;
  page.drawText(companyProfile.nameZh, { x: M, y: headTop, size: 15, font, color: INK });
  page.drawText(companyProfile.nameEn, { x: M, y: headTop - 17, size: 9, font, color: MUTED });
  page.drawText(`TEL: ${companyProfile.tel}`, { x: M, y: headTop - 32, size: 9, font, color: MUTED });
  page.drawText(`FAX: ${companyProfile.fax}`, { x: M, y: headTop - 45, size: 9, font, color: MUTED });
  page.drawText(companyProfile.address, { x: M, y: headTop - 58, size: 9, font, color: MUTED });
  page.drawText(companyProfile.website, { x: M, y: headTop - 71, size: 9, font, color: MUTED });

  page.drawText("Quotation", { x: W - M - 110, y: headTop, size: 22, font, color: INK });
  page.drawText(data.quoteNo, { x: W - M - 110, y: headTop - 18, size: 12, font, color: MUTED });

  y = headTop - 92;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1, color: LINE });
  y -= 22;

  // 客戶 / 單據資訊（兩欄）
  const left = M;
  const right = W / 2 + 10;
  let ly = y;
  let ry = y;

  const leftLine = (label: string, value?: string | null) => {
    page.drawText(`${label}: `, { x: left, y: ly, size: 10, font });
    const labelW = font.widthOfTextAtSize(`${label}: `, 10);
    if (value) {
      page.drawText(value, { x: left + labelW, y: ly, size: 10, font });
    }
    ly -= 16;
  };
  const rightLine = (label: string, value?: string | null) => {
    page.drawText(`${label}: `, { x: right, y: ry, size: 10, font });
    const labelW = font.widthOfTextAtSize(`${label}: `, 10);
    if (value) {
      page.drawText(value, { x: right + labelW, y: ry, size: 10, font });
    }
    ry -= 16;
  };

  leftLine("客戶名稱", data.customerName);
  leftLine("聯絡人", data.contactName ?? undefined);
  leftLine("聯絡電話", data.contactPhone ?? undefined);
  leftLine("統編", data.customerTaxId ?? undefined);

  rightLine("報價單號", data.quoteNo);
  rightLine("報價日期", rocDate(data.quoteDate));
  rightLine("報價更新日期", rocDate(data.quoteDate));
  if (data.validUntil) rightLine("有效期限", rocDate(data.validUntil));
  rightLine("經辦人", data.handler ?? companyProfile.handler);

  y = Math.min(ly, ry) - 8;

  // 品項表格
  const cols = {
    no: M,
    desc: M + 32,
    qty: W - M - 190,
    unit: W - M - 150,
    price: W - M - 105,
    sub: W - M - 50,
  };

  page.drawRectangle({ x: M, y: y - 4, width: W - M * 2, height: 20, color: rgb(0.95, 0.94, 0.98) });
  page.drawText("項目", { x: cols.no + 4, y: y + 2, size: 9, font });
  page.drawText("品名 / 型號 / 規格 / 說明 / 序號", { x: cols.desc, y: y + 2, size: 9, font });
  page.drawText("數量", { x: cols.qty, y: y + 2, size: 9, font });
  page.drawText("單位", { x: cols.unit, y: y + 2, size: 9, font });
  page.drawText("單價", { x: cols.price, y: y + 2, size: 9, font });
  page.drawText("小計", { x: cols.sub, y: y + 2, size: 9, font });
  y -= 20;

  for (const item of data.items) {
    page.drawText(String(item.lineNo), { x: cols.no + 4, y, size: 10, font });
    const descLines = item.description.split("\n").slice(0, 4);
    descLines.forEach((line, i) => {
      page.drawText(line, { x: cols.desc, y: y - i * 14, size: 10, font });
    });
    page.drawText(String(item.qty), { x: cols.qty, y, size: 10, font });
    page.drawText(item.unit, { x: cols.unit, y, size: 10, font });
    page.drawText(money(item.priceCents), { x: cols.price, y, size: 10, font });
    page.drawText(money(item.subtotalCents), { x: cols.sub, y, size: 10, font });
    y -= 14 * descLines.length + 6;
    page.drawLine({ start: { x: M, y: y + 8 }, end: { x: W - M, y: y + 8 }, thickness: 0.5, color: LINE });
  }

  // 總計
  y -= 6;
  const totalLabelX = W - M - 200;
  const totalValueX = W - M - 80;
  const totalRow = (label: string, value: string, strong = false) => {
    page.drawText(label, { x: totalLabelX, y, size: strong ? 11 : 10, font });
    page.drawText(value, { x: totalValueX, y, size: strong ? 11 : 10, font });
    y -= 18;
  };
  totalRow("小計 (未稅, NTD)", money(data.subtotalCents));
  totalRow(`稅金 (${(data.taxRateBasisPoints / 100).toFixed(0)}%)`, money(data.taxCents));
  page.drawLine({ start: { x: totalLabelX, y: y + 10 }, end: { x: W - M, y: y + 10 }, thickness: 0.8, color: INK });
  totalRow("合計 (含稅, NTD)", money(data.totalCents), true);

  // 備註
  y -= 10;
  page.drawText("備註", { x: M, y, size: 10, font });
  y -= 16;
  const notes = (data.note ?? "").split("\n").filter(Boolean);
  const defaultNotes = [
    "報價金額均未稅，稅金依系統設定稅率外加。",
    "本報價單依報價日起 30 日內有效。",
  ];
  const allNotes = notes.length ? notes : defaultNotes;
  allNotes.forEach((n, i) => {
    page.drawText(`${i + 1}、${n}`, { x: M, y, size: 9, font });
    y -= 14;
  });

  // 頁尾
  page.drawText(`${companyProfile.email}　${companyProfile.address}`, {
    x: M,
    y: 40,
    size: 8,
    font,
    color: MUTED,
  });

  return doc.save();
}
