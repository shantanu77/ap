ALTER TABLE `genius_lesson_cache`
  ADD COLUMN `contentVersion` INTEGER NOT NULL DEFAULT 1;

ALTER TABLE `genius_deep_dive_cache`
  ADD COLUMN `contentVersion` INTEGER NOT NULL DEFAULT 1;

ALTER TABLE `genius_lesson_cache`
  DROP INDEX `genius_lesson_cache_subject_canonicalTopic_key`,
  ADD UNIQUE INDEX `genius_lesson_cache_topic_version_key` (`subject`, `canonicalTopic`, `contentVersion`);
