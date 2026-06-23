-- CreateTable
CREATE TABLE "UserCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cardProductId" TEXT,
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
    CONSTRAINT "UserCard_cardProductId_fkey" FOREIGN KEY ("cardProductId") REFERENCES "CardProduct" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UserCard_userId_inputBIN_key" ON "UserCard"("userId", "inputBIN");
