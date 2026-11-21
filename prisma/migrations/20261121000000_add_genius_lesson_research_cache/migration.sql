CREATE TABLE `genius_lesson_cache` (
  `id` VARCHAR(191) NOT NULL,
  `subject` VARCHAR(32) NOT NULL,
  `canonicalTopic` VARCHAR(191) NOT NULL,
  `displayTitle` VARCHAR(191) NOT NULL,
  `content` JSON NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `genius_lesson_cache_subject_canonicalTopic_key` (`subject`, `canonicalTopic`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `genius_deep_dive_cache` (
  `id` VARCHAR(191) NOT NULL,
  `subject` VARCHAR(32) NOT NULL,
  `canonicalTopic` VARCHAR(191) NOT NULL,
  `studyLevel` INTEGER NOT NULL,
  `queryText` VARCHAR(1000) NOT NULL,
  `embedding` JSON NOT NULL,
  `node` JSON NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `genius_deep_dive_cache_topic_level_createdAt_idx` (`subject`, `canonicalTopic`, `studyLevel`, `createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
