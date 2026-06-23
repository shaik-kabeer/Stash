-- CreateTable
CREATE TABLE "Bank" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "website" TEXT,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bankId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "cardType" TEXT NOT NULL DEFAULT 'credit',
    "tier" TEXT,
    "annualFee" REAL NOT NULL DEFAULT 0,
    "joiningFee" REAL NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "color" TEXT,
    "bestFor" TEXT,
    "worstFor" TEXT,
    "estimatedAnnualValue" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Card_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Benefit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cardId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "terms" TEXT,
    "valueEstimate" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Benefit_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NormalizedProgram" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pointName" TEXT NOT NULL,
    "earnRate" TEXT NOT NULL,
    "earnDescription" TEXT,
    "expiryMonths" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NormalizedProgram_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RedemptionOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "conversionRate" REAL NOT NULL,
    "minPoints" REAL NOT NULL DEFAULT 0,
    "description" TEXT,
    "estimatedCPP" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RedemptionOption_programId_fkey" FOREIGN KEY ("programId") REFERENCES "NormalizedProgram" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TransferPartner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programId" TEXT NOT NULL,
    "partnerName" TEXT NOT NULL,
    "partnerType" TEXT NOT NULL,
    "transferRatio" TEXT NOT NULL,
    "transferFee" REAL NOT NULL DEFAULT 0,
    "transferTime" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TransferPartner_programId_fkey" FOREIGN KEY ("programId") REFERENCES "NormalizedProgram" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cardId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "merchant" TEXT,
    "discountType" TEXT,
    "discountValue" TEXT,
    "validFrom" DATETIME,
    "validTo" DATETIME,
    "terms" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Offer_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CardBIN2" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bin" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "tier" TEXT,
    "country" TEXT NOT NULL DEFAULT 'IN',
    CONSTRAINT "CardBIN2_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserReward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "balance" REAL NOT NULL DEFAULT 0,
    "lastSynced" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserReward_programId_fkey" FOREIGN KEY ("programId") REFERENCES "NormalizedProgram" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SourcePage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "bankId" TEXT,
    "cardId" TEXT,
    "pageType" TEXT NOT NULL DEFAULT 'card_page',
    "lastCrawledAt" DATETIME,
    "contentHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rawContent" TEXT,
    "extractedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SourcePage_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SourcePage_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CrawlJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourcePageId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "method" TEXT NOT NULL,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "error" TEXT,
    "durationMs" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrawlJob_sourcePageId_fkey" FOREIGN KEY ("sourcePageId") REFERENCES "SourcePage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExtractionJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourcePageId" TEXT NOT NULL,
    "crawlJobId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "model" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "extractedData" TEXT,
    "validationErrors" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExtractionJob_sourcePageId_fkey" FOREIGN KEY ("sourcePageId") REFERENCES "SourcePage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExtractionJob_crawlJobId_fkey" FOREIGN KEY ("crawlJobId") REFERENCES "CrawlJob" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cardProductId" TEXT,
    "cardId" TEXT,
    "inputBIN" TEXT NOT NULL,
    "last4" TEXT,
    "nickname" TEXT,
    "bank" TEXT,
    "network" TEXT,
    "cardType" TEXT,
    "tier" TEXT,
    "country" TEXT,
    "productName" TEXT,
    "confidence" TEXT NOT NULL DEFAULT 'unknown',
    "confidenceScore" REAL NOT NULL DEFAULT 0,
    "matchSource" TEXT,
    "rewardProgramId" TEXT,
    "pipelineLog" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "onboardedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserCard_rewardProgramId_fkey" FOREIGN KEY ("rewardProgramId") REFERENCES "RewardProgram" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "UserCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserCard_cardProductId_fkey" FOREIGN KEY ("cardProductId") REFERENCES "CardProduct" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "UserCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UserCard" ("bank", "cardProductId", "cardType", "confidence", "confidenceScore", "country", "id", "inputBIN", "isActive", "last4", "matchSource", "network", "nickname", "onboardedAt", "pipelineLog", "productName", "rewardProgramId", "tier", "updatedAt", "userId") SELECT "bank", "cardProductId", "cardType", "confidence", "confidenceScore", "country", "id", "inputBIN", "isActive", "last4", "matchSource", "network", "nickname", "onboardedAt", "pipelineLog", "productName", "rewardProgramId", "tier", "updatedAt", "userId" FROM "UserCard";
DROP TABLE "UserCard";
ALTER TABLE "new_UserCard" RENAME TO "UserCard";
CREATE UNIQUE INDEX "UserCard_userId_inputBIN_key" ON "UserCard"("userId", "inputBIN");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Bank_code_key" ON "Bank"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CardBIN2_bin_key" ON "CardBIN2"("bin");

-- CreateIndex
CREATE UNIQUE INDEX "UserReward_userId_programId_key" ON "UserReward"("userId", "programId");

-- CreateIndex
CREATE UNIQUE INDEX "SourcePage_url_key" ON "SourcePage"("url");
