CREATE TABLE `ledger_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`category` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`created_by_user_id` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ledger_entries_date_idx` ON `ledger_entries` (`date`);