/**
 * 共用商业规则：税额、分润。
 * 所有金额都以整数「分」计算，避免浮点误差。
 */

export function calcTaxCents(subtotalCents: number, rateBasisPoints: number) {
  return Math.round((subtotalCents * rateBasisPoints) / 10_000);
}

export function calcTotals(subtotalCents: number, rateBasisPoints: number) {
  const taxCents = calcTaxCents(subtotalCents, rateBasisPoints);
  return { taxCents, totalCents: subtotalCents + taxCents };
}

export type ProfitInput = {
  revenueCents: number;
  costCents: number;
  companyBasePercent: number;
  salespersonPercent: number;
};

export function calcProfit(input: ProfitInput) {
  const { revenueCents, costCents, companyBasePercent, salespersonPercent } = input;

  if (companyBasePercent < 0 || companyBasePercent > 100) {
    throw new Error("公司基本留比例必须在 0–100 之间");
  }
  if (salespersonPercent < 0 || salespersonPercent > 100) {
    throw new Error("业务分润比例必须在 0–100 之间");
  }
  if (companyBasePercent + salespersonPercent > 100) {
    throw new Error("公司基本留 + 业务分润不得超过 100%");
  }

  const profitCents = revenueCents - costCents;
  const companyBaseCents = Math.round((profitCents * companyBasePercent) / 100);
  const salespersonCents = Math.round((profitCents * salespersonPercent) / 100);
  const companyRemainderCents = profitCents - companyBaseCents - salespersonCents;

  return {
    profitCents,
    companyBaseCents,
    salespersonPercent,
    salespersonCents,
    companyRemainderCents,
  };
}
