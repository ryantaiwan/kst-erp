CREATE TABLE `attendance_record` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`date` integer NOT NULL,
	`type` text DEFAULT 'normal' NOT NULL,
	`check_in` text,
	`check_out` text,
	`hours` integer DEFAULT 0 NOT NULL,
	`overtime_hours` integer DEFAULT 0 NOT NULL,
	`note` text,
	`created_at` integer,
	FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `department` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`parent_id` text,
	`manager_employee_id` text,
	`note` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `department_code_unique` ON `department` (`code`);--> statement-breakpoint
CREATE TABLE `employee` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`employee_no` text NOT NULL,
	`name` text NOT NULL,
	`department_id` text,
	`title` text,
	`email` text,
	`phone` text,
	`national_id` text,
	`birth_date` integer,
	`hire_date` integer NOT NULL,
	`leave_date` integer,
	`salary_cents` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`note` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`department_id`) REFERENCES `department`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employee_employee_no_unique` ON `employee` (`employee_no`);--> statement-breakpoint
CREATE TABLE `leave_request` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`type` text NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`hours` integer DEFAULT 0 NOT NULL,
	`reason` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`approved_by` text,
	`approved_at` integer,
	`created_at` integer,
	FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON UPDATE no action ON DELETE cascade
);
