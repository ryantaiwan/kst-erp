CREATE TABLE `customer_department` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`parent_id` text,
	`name` text NOT NULL,
	`code` text,
	`manager` text,
	`note` text,
	`created_at` integer,
	FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE cascade
);
