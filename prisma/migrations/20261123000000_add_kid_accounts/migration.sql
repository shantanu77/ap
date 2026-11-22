CREATE TABLE `kid_profiles` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NULL,
  `name` VARCHAR(80) NOT NULL,
  `grade` INTEGER NOT NULL DEFAULT 6,
  `emoji` VARCHAR(16) NOT NULL DEFAULT '🦊',
  `timezone` VARCHAR(80) NOT NULL DEFAULT 'Asia/Kolkata',
  `emailVerifiedAt` DATETIME(3) NULL,
  `guardianAttestedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `kid_profiles_email_key` (`email`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- The current single-learner data is kept under a stable legacy profile ID.
INSERT INTO `kid_profiles` (`id`, `email`, `name`, `grade`, `emoji`, `timezone`, `emailVerifiedAt`, `createdAt`, `updatedAt`)
SELECT 'legacy-aashvath', NULLIF(LOWER(TRIM(`reminderEmail`)), ''), 'Aashvath', 6, '🦊', 'Europe/Paris',
       CASE WHEN `reminderEmail` IS NULL OR `reminderEmail` = '' THEN NULL ELSE CURRENT_TIMESTAMP(3) END,
       CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `board_settings` WHERE `id` = 'board';

CREATE TABLE `login_codes` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `codeHash` VARCHAR(128) NOT NULL,
  `draftName` VARCHAR(80) NOT NULL,
  `draftGrade` INTEGER NOT NULL,
  `draftEmoji` VARCHAR(16) NOT NULL,
  `draftTimezone` VARCHAR(80) NOT NULL DEFAULT 'Asia/Kolkata',
  `attested` BOOLEAN NOT NULL DEFAULT false,
  `requestHash` VARCHAR(128) NOT NULL,
  `attempts` INTEGER NOT NULL DEFAULT 0,
  `expiresAt` DATETIME(3) NOT NULL,
  `consumedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `login_codes_email_createdAt_idx` (`email`, `createdAt`),
  INDEX `login_codes_requestHash_createdAt_idx` (`requestHash`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `auth_sessions` (
  `id` VARCHAR(191) NOT NULL,
  `kidId` VARCHAR(191) NOT NULL,
  `tokenHash` VARCHAR(128) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `revokedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `auth_sessions_tokenHash_key` (`tokenHash`),
  INDEX `auth_sessions_kidId_expiresAt_idx` (`kidId`, `expiresAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `auth_sessions_kidId_fkey` FOREIGN KEY (`kidId`) REFERENCES `kid_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `daily_plans` ADD COLUMN `kidId` VARCHAR(191) NULL;
UPDATE `daily_plans` SET `kidId` = 'legacy-aashvath';
ALTER TABLE `daily_plans` MODIFY `kidId` VARCHAR(191) NOT NULL;
ALTER TABLE `daily_plans` DROP INDEX `daily_plans_date_key`;
CREATE UNIQUE INDEX `daily_plans_kidId_date_key` ON `daily_plans` (`kidId`, `date`);
CREATE INDEX `daily_plans_kidId_date_idx` ON `daily_plans` (`kidId`, `date`);
ALTER TABLE `daily_plans` ADD CONSTRAINT `daily_plans_kidId_fkey` FOREIGN KEY (`kidId`) REFERENCES `kid_profiles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `board_settings` ADD COLUMN `kidId` VARCHAR(191) NULL;
UPDATE `board_settings` SET `kidId` = 'legacy-aashvath' WHERE `id` = 'board';
ALTER TABLE `board_settings` ALTER COLUMN `id` DROP DEFAULT;
ALTER TABLE `board_settings` MODIFY `kidId` VARCHAR(191) NOT NULL;
CREATE UNIQUE INDEX `board_settings_kidId_key` ON `board_settings` (`kidId`);
ALTER TABLE `board_settings` ADD CONSTRAINT `board_settings_kidId_fkey` FOREIGN KEY (`kidId`) REFERENCES `kid_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `genius_explorations` ADD COLUMN `kidId` VARCHAR(191) NULL;
UPDATE `genius_explorations` SET `kidId` = 'legacy-aashvath';
ALTER TABLE `genius_explorations` MODIFY `kidId` VARCHAR(191) NOT NULL;
CREATE INDEX `genius_explorations_kidId_deletedAt_savedAt_idx` ON `genius_explorations` (`kidId`, `deletedAt`, `savedAt`);
ALTER TABLE `genius_explorations` ADD CONSTRAINT `genius_explorations_kidId_fkey` FOREIGN KEY (`kidId`) REFERENCES `kid_profiles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE `genius_ratings` (
  `id` VARCHAR(191) NOT NULL,
  `kidId` VARCHAR(191) NOT NULL,
  `explorationId` VARCHAR(191) NOT NULL,
  `nodeId` VARCHAR(191) NOT NULL,
  `rating` INTEGER NOT NULL,
  `feedback` VARCHAR(500) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `genius_ratings_kidId_explorationId_nodeId_key` (`kidId`, `explorationId`, `nodeId`),
  INDEX `genius_ratings_explorationId_nodeId_idx` (`explorationId`, `nodeId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `genius_ratings_kidId_fkey` FOREIGN KEY (`kidId`) REFERENCES `kid_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `genius_ratings_explorationId_fkey` FOREIGN KEY (`explorationId`) REFERENCES `genius_explorations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
