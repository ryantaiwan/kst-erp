ALTER TABLE `customer_contact` ADD COLUMN `department_id` text REFERENCES `customer_department`(`id`);
