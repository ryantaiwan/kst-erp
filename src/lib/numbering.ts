/**
 * 單號規則（依既有報價單范本反推）：
 *   報價單 Q + 民國年(3碼) + 月(2碼) + 日(2碼) + 流水(3碼)
 *   例：Q1080815003 = 民國108年/08月15日/第003筆
 *       Q1151028001 = 民國115年/10月28日/第001筆
 */

function rocYear(date: Date) {
  return date.getUTCFullYear() - 1911;
}

function pad(n: number, len: number) {
  return String(n).padStart(len, "0");
}

/** 產生日期部分的單號前綴，例如 Q1080815 */
export function quoteNoPrefix(date: Date) {
  return `Q${pad(rocYear(date), 3)}${pad(date.getUTCMonth() + 1, 2)}${pad(date.getUTCDate(), 2)}`;
}

/**
 * 依前綴與既有單號產生不重複的單號。
 * 既有 Q1080815001 -> 流水 001，重複則遞增。
 */
export function nextQuoteNo(date: Date, existingNos: string[]) {
  const prefix = quoteNoPrefix(date);
  const used = new Set(
    existingNos
      .filter((no) => no.startsWith(prefix))
      .map((no) => Number(no.slice(prefix.length)))
      .filter((n) => Number.isFinite(n)),
  );

  let seq = 1;
  while (used.has(seq)) seq += 1;
  return `${prefix}${pad(seq, 3)}`;
}

/** 採購單號：PO + 民國年 + 月 + 日 + 流水 */
export function nextPoNo(date: Date, existingNos: string[]) {
  const prefix = `PO${pad(rocYear(date), 3)}${pad(date.getUTCMonth() + 1, 2)}${pad(date.getUTCDate(), 2)}`;
  const used = new Set(
    existingNos
      .filter((no) => no.startsWith(prefix))
      .map((no) => Number(no.slice(prefix.length)))
      .filter((n) => Number.isFinite(n)),
  );
  let seq = 1;
  while (used.has(seq)) seq += 1;
  return `${prefix}${pad(seq, 3)}`;
}

/** 出貨單號：SH + 民國年 + 月 + 日 + 流水 */
export function nextShipNo(date: Date, existingNos: string[]) {
  const prefix = `SH${pad(rocYear(date), 3)}${pad(date.getUTCMonth() + 1, 2)}${pad(date.getUTCDate(), 2)}`;
  const used = new Set(
    existingNos
      .filter((no) => no.startsWith(prefix))
      .map((no) => Number(no.slice(prefix.length)))
      .filter((n) => Number.isFinite(n)),
  );
  let seq = 1;
  while (used.has(seq)) seq += 1;
  return `${prefix}${pad(seq, 3)}`;
}

/** 入庫單號：RC + 民國年 + 月 + 日 + 流水 */
export function nextReceiveNo(date: Date, existingNos: string[]) {
  const prefix = `RC${pad(rocYear(date), 3)}${pad(date.getUTCMonth() + 1, 2)}${pad(date.getUTCDate(), 2)}`;
  const used = new Set(
    existingNos
      .filter((no) => no.startsWith(prefix))
      .map((no) => Number(no.slice(prefix.length)))
      .filter((n) => Number.isFinite(n)),
  );
  let seq = 1;
  while (used.has(seq)) seq += 1;
  return `${prefix}${pad(seq, 3)}`;
}

/** 詢價單號：RFQ + 民國年 + 月 + 日 + 流水 */
export function nextRfqNo(date: Date, existingNos: string[]) {
  const prefix = `RFQ${pad(rocYear(date), 3)}${pad(date.getUTCMonth() + 1, 2)}${pad(date.getUTCDate(), 2)}`;
  const used = new Set(
    existingNos
      .filter((no) => no.startsWith(prefix))
      .map((no) => Number(no.slice(prefix.length)))
      .filter((n) => Number.isFinite(n)),
  );
  let seq = 1;
  while (used.has(seq)) seq += 1;
  return `${prefix}${pad(seq, 3)}`;
}

/** 銷貨訂單號：SO + 民國年 + 月 + 日 + 流水 */
export function nextSoNo(date: Date, existingNos: string[]) {
  const prefix = `SO${pad(rocYear(date), 3)}${pad(date.getUTCMonth() + 1, 2)}${pad(date.getUTCDate(), 2)}`;
  const used = new Set(
    existingNos
      .filter((no) => no.startsWith(prefix))
      .map((no) => Number(no.slice(prefix.length)))
      .filter((n) => Number.isFinite(n)),
  );
  let seq = 1;
  while (used.has(seq)) seq += 1;
  return `${prefix}${pad(seq, 3)}`;
}
