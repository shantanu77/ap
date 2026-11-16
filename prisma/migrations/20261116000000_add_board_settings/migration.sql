CREATE TABLE `board_settings` (
  `id` VARCHAR(191) NOT NULL DEFAULT 'board',
  `activeDays` JSON NOT NULL,
  `remindersEnabled` BOOLEAN NOT NULL DEFAULT false,
  `reminderEmail` VARCHAR(191) NULL,
  `reminderTime` VARCHAR(5) NOT NULL DEFAULT '18:00',
  `lastReminderDate` VARCHAR(10) NULL,
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `board_settings` (`id`, `activeDays`, `updatedAt`)
VALUES ('board', JSON_ARRAY(0, 2, 4), CURRENT_TIMESTAMP(3));
