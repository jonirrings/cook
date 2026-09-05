-- 时间列从 mode:'timestamp'(秒) + CURRENT_TIMESTAMP(TEXT) 改为 timestamp_ms(毫秒整数)。
-- 旧数据转换：TEXT "YYYY-MM-DD HH:MM:SS" → 毫秒整数，NULL → 当前毫秒。
-- 注意事项：D1 迁移在事务中执行，PRAGMA foreign_keys=OFF 在事务内不生效，
-- 直接 DROP 父表会因子表还有引用行而报外键错误；先把关联数据搬到无外键的
-- 暂存表、清空并删除旧关联表，再重建父表，最后重建带外键的关联表。
CREATE TABLE `__joins_hold` (
	`recipe_id` integer NOT NULL,
	`category_id` integer NOT NULL
);--> statement-breakpoint
INSERT INTO `__joins_hold`("recipe_id", "category_id") SELECT "recipe_id", "category_id" FROM `recipe_categories`;--> statement-breakpoint
DELETE FROM `recipe_categories`;--> statement-breakpoint
DROP TABLE `recipe_categories`;--> statement-breakpoint
ALTER TABLE `categories` RENAME TO `__old_categories`;--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);--> statement-breakpoint
INSERT INTO `categories`("id", "name", "slug", "created_at")
SELECT "id", "name", "slug",
	CASE typeof("created_at")
		WHEN 'text' THEN cast(unixepoch("created_at") * 1000 as integer)
		ELSE coalesce("created_at", cast(unixepoch('subsecond') * 1000 as integer))
	END
FROM `__old_categories`;--> statement-breakpoint
DROP TABLE `__old_categories`;--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
ALTER TABLE `recipes` RENAME TO `__old_recipes`;--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`ingredients` text,
	`steps` text,
	`image_url` text,
	`created_by` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);--> statement-breakpoint
INSERT INTO `recipes`("id", "name", "slug", "description", "ingredients", "steps", "image_url", "created_by", "created_at", "updated_at")
SELECT "id", "name", "slug", "description", "ingredients", "steps", "image_url", "created_by",
	CASE typeof("created_at")
		WHEN 'text' THEN cast(unixepoch("created_at") * 1000 as integer)
		ELSE coalesce("created_at", cast(unixepoch('subsecond') * 1000 as integer))
	END,
	CASE typeof("updated_at")
		WHEN 'text' THEN cast(unixepoch("updated_at") * 1000 as integer)
		ELSE coalesce("updated_at", cast(unixepoch('subsecond') * 1000 as integer))
	END
FROM `__old_recipes`;--> statement-breakpoint
DROP TABLE `__old_recipes`;--> statement-breakpoint
CREATE UNIQUE INDEX `recipes_slug_unique` ON `recipes` (`slug`);--> statement-breakpoint
CREATE TABLE `recipe_categories` (
	`recipe_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
INSERT INTO `recipe_categories`("recipe_id", "category_id") SELECT "recipe_id", "category_id" FROM `__joins_hold`;--> statement-breakpoint
DROP TABLE `__joins_hold`;