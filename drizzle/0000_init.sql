CREATE TABLE `cash_movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cash_session_id` integer NOT NULL,
	`type` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`reason` text NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`cash_session_id`) REFERENCES `cash_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `cash_movements_session_idx` ON `cash_movements` (`cash_session_id`);--> statement-breakpoint
CREATE TABLE `cash_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`terminal_id` integer NOT NULL,
	`opened_by_user_id` integer NOT NULL,
	`opened_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`opening_amount_cents` integer DEFAULT 0 NOT NULL,
	`closed_by_user_id` integer,
	`closed_at` text,
	`expected_cash_cents` integer,
	`counted_cash_cents` integer,
	`difference_cents` integer,
	`status` text DEFAULT 'open' NOT NULL,
	`notes` text,
	FOREIGN KEY (`terminal_id`) REFERENCES `terminals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`opened_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`closed_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cash_sessions_open_terminal_idx` ON `cash_sessions` (`terminal_id`) WHERE status = 'open';--> statement-breakpoint
CREATE INDEX `cash_sessions_opened_at_idx` ON `cash_sessions` (`opened_at`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`doc_number` text,
	`phone` text,
	`email` text,
	`notes` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `document_counters` (
	`doc_type` text PRIMARY KEY NOT NULL,
	`next_number` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`barcode` text,
	`name` text NOT NULL,
	`category_id` integer,
	`cost_cents` integer DEFAULT 0 NOT NULL,
	`price_cents` integer DEFAULT 0 NOT NULL,
	`tax_rate` real,
	`stock` real DEFAULT 0 NOT NULL,
	`min_stock` real,
	`unit` text DEFAULT 'u' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_barcode_idx` ON `products` (`barcode`) WHERE barcode IS NOT NULL;--> statement-breakpoint
CREATE INDEX `products_name_idx` ON `products` (`name`);--> statement-breakpoint
CREATE TABLE `purchase_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`purchase_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`qty` real NOT NULL,
	`unit_cost_cents` integer NOT NULL,
	`line_total_cents` integer NOT NULL,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `purchase_items_purchase_idx` ON `purchase_items` (`purchase_id`);--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`supplier_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`invoice_ref` text,
	`total_cents` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `purchases_created_at_idx` ON `purchases` (`created_at`);--> statement-breakpoint
CREATE TABLE `sale_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sale_id` integer NOT NULL,
	`product_id` integer,
	`description` text NOT NULL,
	`qty` real NOT NULL,
	`unit_price_cents` integer NOT NULL,
	`unit_cost_cents` integer DEFAULT 0 NOT NULL,
	`tax_rate` real,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`line_total_cents` integer NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sale_items_sale_idx` ON `sale_items` (`sale_id`);--> statement-breakpoint
CREATE INDEX `sale_items_product_idx` ON `sale_items` (`product_id`);--> statement-breakpoint
CREATE TABLE `sale_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sale_id` integer NOT NULL,
	`method` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`reference` text,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sale_payments_sale_idx` ON `sale_payments` (`sale_id`);--> statement-breakpoint
CREATE TABLE `sales` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`doc_type` text DEFAULT 'ticket' NOT NULL,
	`doc_number` integer NOT NULL,
	`terminal_id` integer NOT NULL,
	`cash_session_id` integer,
	`user_id` integer NOT NULL,
	`customer_id` integer,
	`subtotal_cents` integer NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer NOT NULL,
	`total_cost_cents` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'completed' NOT NULL,
	`voided_at` text,
	`voided_by_user_id` integer,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`terminal_id`) REFERENCES `terminals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cash_session_id`) REFERENCES `cash_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`voided_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sales_doc_idx` ON `sales` (`doc_type`,`doc_number`);--> statement-breakpoint
CREATE INDEX `sales_created_at_idx` ON `sales` (`created_at`);--> statement-breakpoint
CREATE INDEX `sales_cash_session_idx` ON `sales` (`cash_session_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`type` text NOT NULL,
	`qty_delta` real NOT NULL,
	`stock_after` real NOT NULL,
	`ref_table` text,
	`ref_id` integer,
	`user_id` integer NOT NULL,
	`reason` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `stock_movements_product_idx` ON `stock_movements` (`product_id`);--> statement-breakpoint
CREATE INDEX `stock_movements_created_at_idx` ON `stock_movements` (`created_at`);--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`cuit` text,
	`phone` text,
	`email` text,
	`address` text,
	`notes` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `terminals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`device_token` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `terminals_name_unique` ON `terminals` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `terminals_device_token_unique` ON `terminals` (`device_token`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`full_name` text NOT NULL,
	`role` text DEFAULT 'cajero' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);