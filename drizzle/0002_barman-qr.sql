ALTER TABLE `sales` ADD `redemption_token` text;--> statement-breakpoint
ALTER TABLE `sales` ADD `redeemed_at` text;--> statement-breakpoint
ALTER TABLE `sales` ADD `redeemed_by_user_id` integer REFERENCES users(id);--> statement-breakpoint
CREATE UNIQUE INDEX `sales_redemption_token_idx` ON `sales` (`redemption_token`) WHERE redemption_token IS NOT NULL;