import { z } from "zod";

export const customerSchema = z.object({
  code: z.string().min(1, "代号为必填"),
  name: z.string().min(1, "公司名称为必填"),
  taxId: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  paymentTerm: z.string().optional(),
});

export const supplierSchema = z.object({
  code: z.string().min(1, "编号为必填"),
  name: z.string().min(1, "厂商名称为必填"),
  branchName: z.string().optional(),
  taxId: z.string().optional(),
  paymentTerm: z.string().optional(),
  platformCode: z.string().optional(),
});

export const productSchema = z.object({
  sku: z.string().min(1, "SKU 为必填"),
  name: z.string().min(1, "品名为必填"),
  unit: z.string().min(1).default("顆"),
  cost: z.coerce.number().nonnegative().default(0),
  salePrice: z.coerce.number().nonnegative().default(0),
});

export const quoteItemSchema = z.object({
  description: z.string().min(1),
  qty: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative(),
});

export const quoteSchema = z.object({
  quoteNo: z.string().min(1),
  customerId: z.string().min(1),
  quoteDate: z.coerce.date(),
  validUntil: z.coerce.date().optional(),
  items: z.array(quoteItemSchema).min(1, "至少需要一个品项"),
  note: z.string().optional(),
});

export const taxSettingSchema = z.object({
  rate: z.coerce.number().min(0).max(100),
  startDate: z.coerce.date(),
  note: z.string().optional(),
});

export const profitRuleSchema = z.object({
  companyBasePercent: z.coerce.number().min(0).max(100),
  effectiveDate: z.coerce.date(),
  note: z.string().optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type SupplierInput = z.infer<typeof supplierSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
