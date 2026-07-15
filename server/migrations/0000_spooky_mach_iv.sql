CREATE TABLE `decks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`lang_from` text NOT NULL,
	`lang_to` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `decks_user_idx` ON `decks` (`user_id`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`word_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`deck_id` text NOT NULL,
	`due` integer NOT NULL,
	`state` integer NOT NULL,
	`reps` integer NOT NULL,
	`lapses` integer NOT NULL,
	`last_review` integer,
	`fsrs` text NOT NULL,
	FOREIGN KEY (`word_id`) REFERENCES `words`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`deck_id`) REFERENCES `decks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reviews_user_due_idx` ON `reviews` (`user_id`,`due`);--> statement-breakpoint
CREATE INDEX `reviews_user_state_idx` ON `reviews` (`user_id`,`state`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`telegram_id` text NOT NULL,
	`username` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_telegram_id_unique` ON `users` (`telegram_id`);--> statement-breakpoint
CREATE TABLE `words` (
	`id` text PRIMARY KEY NOT NULL,
	`deck_id` text NOT NULL,
	`front` text NOT NULL,
	`back` text NOT NULL,
	`transcription` text,
	`example` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`deck_id`) REFERENCES `decks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `words_deck_idx` ON `words` (`deck_id`);