CREATE TABLE `account` (
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	PRIMARY KEY(`provider`, `provider_account_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `attachment` (
	`id` text PRIMARY KEY NOT NULL,
	`blob_url` text NOT NULL,
	`pathname` text NOT NULL,
	`mime` text,
	`owner_type` text,
	`owner_id` text,
	`uploaded_by` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`target_type` text,
	`target_id` text,
	`before` text,
	`after` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `customer_contact` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`name` text NOT NULL,
	`mobile` text,
	`phone` text,
	`ext` text,
	`email` text,
	`is_primary` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customer` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text,
	`name` text NOT NULL,
	`tax_id` text,
	`zip_code` text,
	`address` text,
	`phone` text,
	`fax` text,
	`payment_term` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customer_code_unique` ON `customer` (`code`);--> statement-breakpoint
CREATE TABLE `external_identity` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`email` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `feature_visibility` (
	`account_type` text NOT NULL,
	`feature_key` text NOT NULL,
	`level` text NOT NULL,
	PRIMARY KEY(`account_type`, `feature_key`)
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`product_id` text NOT NULL,
	`warehouse_id` text NOT NULL,
	`qty` integer DEFAULT 0 NOT NULL,
	`updated_at` integer,
	PRIMARY KEY(`product_id`, `warehouse_id`),
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `inventory_transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`warehouse_id` text NOT NULL,
	`type` text NOT NULL,
	`qty` integer NOT NULL,
	`ref_type` text,
	`ref_id` text,
	`created_at` integer,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoice_item` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`ref_type` text,
	`ref_id` text,
	`description` text,
	`amount_cents` integer NOT NULL,
	`tax_cents` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoice`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `invoice` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_no` text NOT NULL,
	`type` text NOT NULL,
	`party_id` text,
	`invoice_date` integer NOT NULL,
	`amount_cents` integer NOT NULL,
	`tax_cents` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT '未開' NOT NULL,
	`paid_at` integer,
	`delay_days` integer,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoice_invoice_no_unique` ON `invoice` (`invoice_no`);--> statement-breakpoint
CREATE TABLE `product` (
	`id` text PRIMARY KEY NOT NULL,
	`sku` text NOT NULL,
	`name` text NOT NULL,
	`spec` text,
	`unit` text DEFAULT '顆' NOT NULL,
	`cost_cents` integer DEFAULT 0 NOT NULL,
	`sale_price_cents` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_sku_unique` ON `product` (`sku`);--> statement-breakpoint
CREATE TABLE `profit_record` (
	`id` text PRIMARY KEY NOT NULL,
	`source_type` text NOT NULL,
	`source_id` text NOT NULL,
	`revenue_cents` integer NOT NULL,
	`cost_cents` integer NOT NULL,
	`profit_cents` integer NOT NULL,
	`company_base_cents` integer NOT NULL,
	`salesperson_percent` integer DEFAULT 0 NOT NULL,
	`salesperson_cents` integer DEFAULT 0 NOT NULL,
	`company_remainder_cents` integer NOT NULL,
	`tax_rate_snapshot` integer NOT NULL,
	`settled_at` integer,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `profit_rule` (
	`id` text PRIMARY KEY NOT NULL,
	`company_base_percent` integer DEFAULT 65 NOT NULL,
	`effective_date` integer NOT NULL,
	`note` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `purchase_order_item` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`line_no` integer NOT NULL,
	`product_id` text,
	`description` text NOT NULL,
	`qty` integer NOT NULL,
	`received_qty` integer DEFAULT 0 NOT NULL,
	`unit_price_cents` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `purchase_order`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `purchase_order` (
	`id` text PRIMARY KEY NOT NULL,
	`po_no` text NOT NULL,
	`supplier_id` text NOT NULL,
	`request_id` text,
	`expected_date` integer,
	`total_cents` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`supplier_id`) REFERENCES `supplier`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`request_id`) REFERENCES `purchase_request`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_order_po_no_unique` ON `purchase_order` (`po_no`);--> statement-breakpoint
CREATE TABLE `purchase_request_item` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`product_id` text,
	`description` text NOT NULL,
	`qty` integer NOT NULL,
	`unit_price_cents` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `purchase_request`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `purchase_request` (
	`id` text PRIMARY KEY NOT NULL,
	`rfq_no` text NOT NULL,
	`supplier_id` text,
	`deadline` integer,
	`expected_date` integer,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`supplier_id`) REFERENCES `supplier`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_request_rfq_no_unique` ON `purchase_request` (`rfq_no`);--> statement-breakpoint
CREATE TABLE `quote_item` (
	`id` text PRIMARY KEY NOT NULL,
	`quote_id` text NOT NULL,
	`line_no` integer NOT NULL,
	`description` text NOT NULL,
	`qty` integer DEFAULT 1 NOT NULL,
	`unit` text DEFAULT '顆' NOT NULL,
	`price_cents` integer NOT NULL,
	`subtotal_cents` integer NOT NULL,
	FOREIGN KEY (`quote_id`) REFERENCES `quote`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `quote` (
	`id` text PRIMARY KEY NOT NULL,
	`quote_no` text NOT NULL,
	`customer_id` text NOT NULL,
	`contact_id` text,
	`quote_date` integer NOT NULL,
	`valid_until` integer,
	`tax_rate_snapshot` integer NOT NULL,
	`subtotal_cents` integer DEFAULT 0 NOT NULL,
	`tax_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`handler` text,
	`note` text,
	`created_at` integer,
	FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`contact_id`) REFERENCES `customer_contact`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quote_quote_no_unique` ON `quote` (`quote_no`);--> statement-breakpoint
CREATE TABLE `receivable_payment` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`paid_at` integer NOT NULL,
	`amount_cents` integer NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoice`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `receiving_item` (
	`id` text PRIMARY KEY NOT NULL,
	`receive_id` text NOT NULL,
	`product_id` text,
	`release_no` text,
	`au_sku` text,
	`serial_no` text,
	`qty` integer NOT NULL,
	FOREIGN KEY (`receive_id`) REFERENCES `receiving_order`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `receiving_order` (
	`id` text PRIMARY KEY NOT NULL,
	`receive_no` text NOT NULL,
	`po_id` text NOT NULL,
	`received_at` integer NOT NULL,
	`note` text,
	`created_at` integer,
	FOREIGN KEY (`po_id`) REFERENCES `purchase_order`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `receiving_order_receive_no_unique` ON `receiving_order` (`receive_no`);--> statement-breakpoint
CREATE TABLE `role_permission` (
	`role_key` text NOT NULL,
	`module` text NOT NULL,
	`action` text NOT NULL,
	PRIMARY KEY(`role_key`, `module`, `action`),
	FOREIGN KEY (`role_key`) REFERENCES `role`(`key`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `role` (
	`key` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sales_order_item` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`line_no` integer NOT NULL,
	`product_id` text,
	`description` text NOT NULL,
	`qty` integer NOT NULL,
	`shipped_qty` integer DEFAULT 0 NOT NULL,
	`price_cents` integer NOT NULL,
	`subtotal_cents` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `sales_order`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sales_order` (
	`id` text PRIMARY KEY NOT NULL,
	`so_no` text NOT NULL,
	`customer_id` text NOT NULL,
	`quote_id` text,
	`expected_ship_date` integer,
	`tax_rate_snapshot` integer NOT NULL,
	`subtotal_cents` integer DEFAULT 0 NOT NULL,
	`tax_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`quote_id`) REFERENCES `quote`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sales_order_so_no_unique` ON `sales_order` (`so_no`);--> statement-breakpoint
CREATE TABLE `session` (
	`session_token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `shipment_item` (
	`id` text PRIMARY KEY NOT NULL,
	`shipment_id` text NOT NULL,
	`order_item_id` text,
	`release_no` text,
	`serial_no` text,
	`description` text NOT NULL,
	`qty` integer NOT NULL,
	FOREIGN KEY (`shipment_id`) REFERENCES `shipment`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_item_id`) REFERENCES `sales_order_item`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `shipment` (
	`id` text PRIMARY KEY NOT NULL,
	`ship_no` text NOT NULL,
	`so_id` text NOT NULL,
	`shipped_at` integer NOT NULL,
	`note` text,
	`created_at` integer,
	FOREIGN KEY (`so_id`) REFERENCES `sales_order`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shipment_ship_no_unique` ON `shipment` (`ship_no`);--> statement-breakpoint
CREATE TABLE `supplier_contact` (
	`id` text PRIMARY KEY NOT NULL,
	`supplier_id` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`is_primary` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`supplier_id`) REFERENCES `supplier`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `supplier` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text,
	`name` text NOT NULL,
	`branch_name` text,
	`tax_id` text,
	`zip_code` text,
	`address` text,
	`payment_term` text,
	`platform_code` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `supplier_code_unique` ON `supplier` (`code`);--> statement-breakpoint
CREATE TABLE `system_setting` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `tax_setting` (
	`id` text PRIMARY KEY NOT NULL,
	`rate_basis_points` integer NOT NULL,
	`start_date` integer NOT NULL,
	`note` text,
	`created_by` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`email_verified` integer,
	`image` text,
	`account_type` text DEFAULT 'employee' NOT NULL,
	`role` text DEFAULT 'viewer' NOT NULL,
	`data_scope` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification_token` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
--> statement-breakpoint
CREATE TABLE `warehouse` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `warehouse_code_unique` ON `warehouse` (`code`);