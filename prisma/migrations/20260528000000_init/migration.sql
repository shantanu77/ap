-- CreateTable
CREATE TABLE `daily_plans` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `content` JSON NOT NULL,
    `edited` BOOLEAN NOT NULL DEFAULT false,
    `editedContent` JSON NULL,

    UNIQUE INDEX `daily_plans_date_key`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `dailyPlanId` VARCHAR(191) NOT NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'PARTIAL', 'COMPLETE', 'MISSED') NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sessions_dailyPlanId_key`(`dailyPlanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `phase_ratings` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `phase` ENUM('DAY_REVIEW', 'READ_ALOUD', 'LANGUAGE', 'WRITING', 'WORK_QUALITY', 'NEXT_DAY_PREP') NOT NULL,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `ratings` JSON NOT NULL,
    `timeSpentSec` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `phase_ratings_sessionId_phase_key`(`sessionId`, `phase`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_dailyPlanId_fkey` FOREIGN KEY (`dailyPlanId`) REFERENCES `daily_plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `phase_ratings` ADD CONSTRAINT `phase_ratings_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
