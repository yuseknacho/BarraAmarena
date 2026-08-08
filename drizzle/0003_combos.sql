CREATE TABLE `product_components` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`component_product_id` integer NOT NULL,
	`qty` real NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`component_product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `product_components_product_idx` ON `product_components` (`product_id`);--> statement-breakpoint
ALTER TABLE `products` ADD `is_combo` integer DEFAULT false NOT NULL;