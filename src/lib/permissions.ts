/** 權限設定的常數定義（供 server 與 client component 共用） */

export const MODULES = [
  { key: "dashboard", label: "總覽" },
  { key: "quote", label: "報價單" },
  { key: "customer", label: "客戶管理" },
  { key: "salesOrder", label: "銷貨訂單" },
  { key: "shipment", label: "出貨作業" },
  { key: "receivable", label: "應收帳款" },
  { key: "purchaseOrder", label: "進貨流程" },
  { key: "receiving", label: "入庫作業" },
  { key: "invoice", label: "發票管理" },
  { key: "inventory", label: "庫存查詢" },
  { key: "profit", label: "利潤計算表" },
  { key: "settings", label: "系統設定 / 權限" },
  { key: "hr", label: "人資模組" },
];

export const ACCOUNT_TYPES = [
  { key: "employee", label: "員工" },
  { key: "customer", label: "客戶" },
  { key: "supplier", label: "廠商" },
];

export const LEVELS = [
  { key: "write", label: "可讀寫" },
  { key: "read", label: "唯讀" },
  { key: "self", label: "可見（自身）" },
  { key: "hidden", label: "遮蔽" },
];
