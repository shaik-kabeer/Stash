-- CreateTable
CREATE TABLE "CardBIN" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bin" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tier" TEXT,
    "country" TEXT NOT NULL DEFAULT 'IN',
    "cardProductId" TEXT,
    CONSTRAINT "CardBIN_cardProductId_fkey" FOREIGN KEY ("cardProductId") REFERENCES "CardProduct" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CardProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "cardType" TEXT NOT NULL DEFAULT 'credit',
    "color" TEXT,
    "imageUrl" TEXT,
    "annualFee" REAL NOT NULL DEFAULT 0,
    "joiningFee" REAL NOT NULL DEFAULT 0,
    "rewardStructure" TEXT,
    "cashbackStructure" TEXT,
    "loungeAccess" TEXT,
    "travelBenefits" TEXT,
    "insuranceBenefits" TEXT,
    "fuelBenefits" TEXT,
    "diningBenefits" TEXT,
    "movieBenefits" TEXT,
    "golfBenefits" TEXT,
    "forexMarkup" TEXT,
    "milestoneRewards" TEXT,
    "welcomeBenefits" TEXT,
    "currentOffers" TEXT,
    "bestFor" TEXT,
    "worstFor" TEXT,
    "estimatedAnnualValue" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CardReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cardProductId" TEXT NOT NULL,
    "inputBIN" TEXT,
    "aiSummary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CardReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CardReport_cardProductId_fkey" FOREIGN KEY ("cardProductId") REFERENCES "CardProduct" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CardBIN_bin_key" ON "CardBIN"("bin");
