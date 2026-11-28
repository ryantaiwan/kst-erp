import { primaryKey, sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () => integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date());

/* ---------- Auth.js / 账号与权限 ---------- */

export const users = sqliteTable("user", {
  id: id(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  image: text("image"),
  accountType: text("account_type").notNull().default("employee"), // employee | customer | supplier
  role: text("role").notNull().default("viewer"),
  dataScope: text("data_scope"),
  status: text("status").notNull().default("active"),
  createdAt: createdAt(),
});

export const accounts = sqliteTable(
  "account",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = sqliteTable("session", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

export const externalIdentities = sqliteTable("external_identity", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // line | google
  providerAccountId: text("provider_account_id").notNull(),
  email: text("email"),
  linkedAt: createdAt(),
});

export const roles = sqliteTable("role", {
  key: text("key").primaryKey(),
  name: text("name").notNull(),
});

export const rolePermissions = sqliteTable(
  "role_permission",
  {
    roleKey: text("role_key").notNull().references(() => roles.key),
    module: text("module").notNull(),
    action: text("action").notNull(), // read | write
  },
  (t) => [primaryKey({ columns: [t.roleKey, t.module, t.action] })],
);

export const featureVisibility = sqliteTable(
  "feature_visibility",
  {
    accountType: text("account_type").notNull(), // employee | customer | supplier
    featureKey: text("feature_key").notNull(),
    level: text("level").notNull(), // write | read | self | hidden
  },
  (t) => [primaryKey({ columns: [t.accountType, t.featureKey] })],
);

export const auditLogs = sqliteTable("audit_log", {
  id: id(),
  actorId: text("actor_id"),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  before: text("before"),
  after: text("after"),
  createdAt: createdAt(),
});

/* ---------- 主数据 ---------- */

export const customers = sqliteTable("customer", {
  id: id(),
  code: text("code").unique(),
  name: text("name").notNull(),
  taxId: text("tax_id"),
  zipCode: text("zip_code"),
  address: text("address"),
  phone: text("phone"),
  fax: text("fax"),
  paymentTerm: text("payment_term"),
  status: text("status").notNull().default("active"),
  createdAt: createdAt(),
});

export const customerContacts = sqliteTable("customer_contact", {
  departmentId: text("department_id").references(() => customerDepartments.id),
  id: id(),
  customerId: text("customer_id").notNull().references(() => customers.id),
  name: text("name").notNull(),
  mobile: text("mobile"),
  phone: text("phone"),
  ext: text("ext"),
  email: text("email"),
  isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
});

export const suppliers = sqliteTable("supplier", {
  id: id(),
  code: text("code").unique(),
  name: text("name").notNull(),
  branchName: text("branch_name"),
  taxId: text("tax_id"),
  zipCode: text("zip_code"),
  address: text("address"),
  paymentTerm: text("payment_term"),
  platformCode: text("platform_code"),
  status: text("status").notNull().default("active"),
  createdAt: createdAt(),
});

export const supplierContacts = sqliteTable("supplier_contact", {
  id: id(),
  supplierId: text("supplier_id").notNull().references(() => suppliers.id),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
});

export const products = sqliteTable("product", {
  id: id(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  spec: text("spec"),
  unit: text("unit").notNull().default("顆"),
  costCents: integer("cost_cents").notNull().default(0),
  salePriceCents: integer("sale_price_cents").notNull().default(0),
  status: text("status").notNull().default("active"),
  createdAt: createdAt(),
});

export const warehouses = sqliteTable("warehouse", {
  id: id(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
});

export const inventory = sqliteTable(
  "inventory",
  {
    productId: text("product_id").notNull().references(() => products.id),
    warehouseId: text("warehouse_id").notNull().references(() => warehouses.id),
    qty: integer("qty").notNull().default(0),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  },
  (t) => [primaryKey({ columns: [t.productId, t.warehouseId] })],
);

export const inventoryTransactions = sqliteTable("inventory_transaction", {
  id: id(),
  productId: text("product_id").notNull().references(() => products.id),
  warehouseId: text("warehouse_id").notNull().references(() => warehouses.id),
  type: text("type").notNull(), // in | out | adjust
  qty: integer("qty").notNull(),
  refType: text("ref_type"),
  refId: text("ref_id"),
  createdAt: createdAt(),
});

/* ---------- 报价 / 采购 ---------- */

export const quotes = sqliteTable("quote", {
  id: id(),
  quoteNo: text("quote_no").notNull().unique(),
  customerId: text("customer_id").notNull().references(() => customers.id),
  contactId: text("contact_id").references(() => customerContacts.id),
  quoteDate: integer("quote_date", { mode: "timestamp" }).notNull(),
  validUntil: integer("valid_until", { mode: "timestamp" }),
  taxRateSnapshot: integer("tax_rate_snapshot").notNull(), // 百分比 * 100，例 500 = 5%
  subtotalCents: integer("subtotal_cents").notNull().default(0),
  taxCents: integer("tax_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull().default(0),
  status: text("status").notNull().default("draft"),
  handler: text("handler"),
  note: text("note"),
  createdAt: createdAt(),
});

export const quoteItems = sqliteTable("quote_item", {
  id: id(),
  quoteId: text("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  lineNo: integer("line_no").notNull(),
  description: text("description").notNull(),
  qty: integer("qty").notNull().default(1),
  unit: text("unit").notNull().default("顆"),
  priceCents: integer("price_cents").notNull(),
  subtotalCents: integer("subtotal_cents").notNull(),
});

export const purchaseRequests = sqliteTable("purchase_request", {
  id: id(),
  rfqNo: text("rfq_no").notNull().unique(),
  supplierId: text("supplier_id").references(() => suppliers.id),
  deadline: integer("deadline", { mode: "timestamp" }),
  expectedDate: integer("expected_date", { mode: "timestamp" }),
  status: text("status").notNull().default("draft"),
  createdAt: createdAt(),
});

export const purchaseRequestItems = sqliteTable("purchase_request_item", {
  id: id(),
  requestId: text("request_id").notNull().references(() => purchaseRequests.id, { onDelete: "cascade" }),
  productId: text("product_id").references(() => products.id),
  description: text("description").notNull(),
  qty: integer("qty").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull().default(0),
});

export const purchaseOrders = sqliteTable("purchase_order", {
  id: id(),
  poNo: text("po_no").notNull().unique(),
  supplierId: text("supplier_id").notNull().references(() => suppliers.id),
  requestId: text("request_id").references(() => purchaseRequests.id),
  expectedDate: integer("expected_date", { mode: "timestamp" }),
  totalCents: integer("total_cents").notNull().default(0),
  status: text("status").notNull().default("confirmed"),
  createdAt: createdAt(),
});

export const purchaseOrderItems = sqliteTable("purchase_order_item", {
  id: id(),
  orderId: text("order_id").notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
  lineNo: integer("line_no").notNull(),
  productId: text("product_id").references(() => products.id),
  description: text("description").notNull(),
  qty: integer("qty").notNull(),
  receivedQty: integer("received_qty").notNull().default(0),
  unitPriceCents: integer("unit_price_cents").notNull(),
});

export const receivingOrders = sqliteTable("receiving_order", {
  id: id(),
  receiveNo: text("receive_no").notNull().unique(),
  poId: text("po_id").notNull().references(() => purchaseOrders.id),
  receivedAt: integer("received_at", { mode: "timestamp" }).notNull(),
  note: text("note"),
  createdAt: createdAt(),
});

export const receivingItems = sqliteTable("receiving_item", {
  id: id(),
  receiveId: text("receive_id").notNull().references(() => receivingOrders.id, { onDelete: "cascade" }),
  productId: text("product_id").references(() => products.id),
  releaseNo: text("release_no"),
  auSku: text("au_sku"),
  serialNo: text("serial_no"),
  qty: integer("qty").notNull(),
});

/* ---------- 销货 / 出货 ---------- */

export const salesOrders = sqliteTable("sales_order", {
  id: id(),
  soNo: text("so_no").notNull().unique(),
  customerId: text("customer_id").notNull().references(() => customers.id),
  quoteId: text("quote_id").references(() => quotes.id),
  expectedShipDate: integer("expected_ship_date", { mode: "timestamp" }),
  taxRateSnapshot: integer("tax_rate_snapshot").notNull(),
  subtotalCents: integer("subtotal_cents").notNull().default(0),
  taxCents: integer("tax_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull().default(0),
  status: text("status").notNull().default("draft"),
  createdAt: createdAt(),
});

export const salesOrderItems = sqliteTable("sales_order_item", {
  id: id(),
  orderId: text("order_id").notNull().references(() => salesOrders.id, { onDelete: "cascade" }),
  lineNo: integer("line_no").notNull(),
  productId: text("product_id").references(() => products.id),
  description: text("description").notNull(),
  qty: integer("qty").notNull(),
  shippedQty: integer("shipped_qty").notNull().default(0),
  priceCents: integer("price_cents").notNull(),
  subtotalCents: integer("subtotal_cents").notNull(),
});

export const shipments = sqliteTable("shipment", {
  id: id(),
  shipNo: text("ship_no").notNull().unique(),
  soId: text("so_id").notNull().references(() => salesOrders.id),
  shippedAt: integer("shipped_at", { mode: "timestamp" }).notNull(),
  note: text("note"),
  createdAt: createdAt(),
});

export const shipmentItems = sqliteTable("shipment_item", {
  id: id(),
  shipmentId: text("shipment_id").notNull().references(() => shipments.id, { onDelete: "cascade" }),
  orderItemId: text("order_item_id").references(() => salesOrderItems.id),
  releaseNo: text("release_no"),
  serialNo: text("serial_no"),
  description: text("description").notNull(),
  qty: integer("qty").notNull(),
});

/* ---------- 发票 / 帐务 ---------- */

export const invoices = sqliteTable("invoice", {
  id: id(),
  invoiceNo: text("invoice_no").notNull().unique(),
  type: text("type").notNull(), // output | input
  partyId: text("party_id"),
  invoiceDate: integer("invoice_date", { mode: "timestamp" }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  taxCents: integer("tax_cents").notNull().default(0),
  status: text("status").notNull().default("未開"),
  paidAt: integer("paid_at", { mode: "timestamp" }),
  delayDays: integer("delay_days"),
  createdAt: createdAt(),
});

export const invoiceItems = sqliteTable("invoice_item", {
  id: id(),
  invoiceId: text("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  refType: text("ref_type"),
  refId: text("ref_id"),
  description: text("description"),
  amountCents: integer("amount_cents").notNull(),
  taxCents: integer("tax_cents").notNull().default(0),
});

export const receivablePayments = sqliteTable("receivable_payment", {
  id: id(),
  invoiceId: text("invoice_id").notNull().references(() => invoices.id),
  paidAt: integer("paid_at", { mode: "timestamp" }).notNull(),
  amountCents: integer("amount_cents").notNull(),
});

export const taxSettings = sqliteTable("tax_setting", {
  id: id(),
  rateBasisPoints: integer("rate_basis_points").notNull(), // 500 = 5%
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  note: text("note"),
  createdBy: text("created_by"),
  createdAt: createdAt(),
});

export const profitRules = sqliteTable("profit_rule", {
  id: id(),
  companyBasePercent: integer("company_base_percent").notNull().default(65),
  effectiveDate: integer("effective_date", { mode: "timestamp" }).notNull(),
  note: text("note"),
  createdAt: createdAt(),
});

export const profitRecords = sqliteTable("profit_record", {
  id: id(),
  sourceType: text("source_type").notNull(),
  sourceId: text("source_id").notNull(),
  revenueCents: integer("revenue_cents").notNull(),
  costCents: integer("cost_cents").notNull(),
  profitCents: integer("profit_cents").notNull(),
  companyBaseCents: integer("company_base_cents").notNull(),
  salespersonPercent: integer("salesperson_percent").notNull().default(0),
  salespersonCents: integer("salesperson_cents").notNull().default(0),
  companyRemainderCents: integer("company_remainder_cents").notNull(),
  taxRateSnapshot: integer("tax_rate_snapshot").notNull(),
  settledAt: integer("settled_at", { mode: "timestamp" }),
  createdAt: createdAt(),
});

export const systemSettings = sqliteTable("system_setting", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const attachments = sqliteTable("attachment", {
  id: id(),
  blobUrl: text("blob_url").notNull(),
  pathname: text("pathname").notNull(),
  mime: text("mime"),
  ownerType: text("owner_type"),
  ownerId: text("owner_id"),
  uploadedBy: text("uploaded_by"),
  createdAt: createdAt(),
});

/* ---------- 人資模組（Phase 4） ---------- */

export const departments = sqliteTable("department", {
  id: id(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  parentId: text("parent_id"),
  managerEmployeeId: text("manager_employee_id"),
  note: text("note"),
  createdAt: createdAt(),
});

export const employees = sqliteTable("employee", {
  id: id(),
  userId: text("user_id").references(() => users.id),
  employeeNo: text("employee_no").notNull().unique(),
  name: text("name").notNull(),
  departmentId: text("department_id").references(() => departments.id),
  title: text("title"),
  email: text("email"),
  phone: text("phone"),
  nationalId: text("national_id"),
  birthDate: integer("birth_date", { mode: "timestamp" }),
  hireDate: integer("hire_date", { mode: "timestamp" }).notNull(),
  leaveDate: integer("leave_date", { mode: "timestamp" }),
  salaryCents: integer("salary_cents").notNull().default(0),
  status: text("status").notNull().default("active"), // active | on_leave | resigned
  note: text("note"),
  createdAt: createdAt(),
});

export const attendanceRecords = sqliteTable("attendance_record", {
  id: id(),
  employeeId: text("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  type: text("type").notNull().default("normal"), // normal | late | early_leave | absent | business_trip | holiday_work
  checkIn: text("check_in"),   // HH:mm
  checkOut: text("check_out"), // HH:mm
  hours: integer("hours").notNull().default(0),        // 工作時數（整數分鐘亦可，這裡用小時）
  overtimeHours: integer("overtime_hours").notNull().default(0),
  note: text("note"),
  createdAt: createdAt(),
});

export const leaveRequests = sqliteTable("leave_request", {
  id: id(),
  employeeId: text("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 特休 | 事假 | 病假 | 婚假 | 喪假 | 產假 | 陪產假 | 補休
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }).notNull(),
  hours: integer("hours").notNull().default(0),
  reason: text("reason"),
  status: text("status").notNull().default("pending"), // pending | approved | rejected | cancelled
  approvedBy: text("approved_by"),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  createdAt: createdAt(),
});

/* ---------- 客戶內部組織（Phase 5） ---------- */

export const customerDepartments = sqliteTable("customer_department", {
  id: id(),
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  parentId: text("parent_id"),
  name: text("name").notNull(),
  code: text("code"),
  manager: text("manager"),
  note: text("note"),
  createdAt: createdAt(),
});
