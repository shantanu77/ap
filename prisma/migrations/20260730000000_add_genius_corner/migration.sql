CREATE TABLE `genius_explorations` (
  `id` VARCHAR(191) NOT NULL,
  `subject` VARCHAR(191) NOT NULL DEFAULT 'chemistry',
  `canonicalTopic` VARCHAR(191) NOT NULL,
  `displayTitle` VARCHAR(191) NOT NULL,
  `defaultLevel` INTEGER NOT NULL,
  `content` JSON NOT NULL,
  `savedSnapshot` JSON NULL,
  `savedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `lastOpenedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `deletedAt` DATETIME(3) NULL,

  INDEX `genius_explorations_savedAt_idx`(`savedAt`),
  INDEX `genius_explorations_lastOpenedAt_idx`(`lastOpenedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
