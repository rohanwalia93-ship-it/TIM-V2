/*
  Warnings:

  - You are about to drop the column `scenarioVersionId` on the `EvidenceValue` table. All the data in the column will be lost.
  - Added the required column `category` to the `EvidenceValue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scenarioId` to the `EvidenceValue` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EvidenceValue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" TEXT,
    "unit" TEXT NOT NULL,
    "geography" TEXT NOT NULL,
    "periodStart" DATETIME,
    "periodEnd" DATETIME,
    "priceBasis" TEXT,
    "status" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "datasetId" TEXT,
    "retrievedAt" DATETIME NOT NULL,
    "publicationDate" DATETIME,
    "license" TEXT,
    "transformation" TEXT,
    "confidence" TEXT NOT NULL,
    "owner" TEXT,
    "approvedBy" TEXT,
    "notes" TEXT,
    "overrideReason" TEXT,
    "overriddenById" TEXT,
    "overriddenAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EvidenceValue_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EvidenceValue_overriddenById_fkey" FOREIGN KEY ("overriddenById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EvidenceValue" ("approvedBy", "confidence", "createdAt", "datasetId", "geography", "id", "license", "metric", "notes", "overriddenAt", "overriddenById", "overrideReason", "owner", "periodEnd", "periodStart", "priceBasis", "publicationDate", "retrievedAt", "sourceName", "sourceUrl", "status", "transformation", "unit", "value") SELECT "approvedBy", "confidence", "createdAt", "datasetId", "geography", "id", "license", "metric", "notes", "overriddenAt", "overriddenById", "overrideReason", "owner", "periodEnd", "periodStart", "priceBasis", "publicationDate", "retrievedAt", "sourceName", "sourceUrl", "status", "transformation", "unit", "value" FROM "EvidenceValue";
DROP TABLE "EvidenceValue";
ALTER TABLE "new_EvidenceValue" RENAME TO "EvidenceValue";
CREATE INDEX "EvidenceValue_scenarioId_metric_idx" ON "EvidenceValue"("scenarioId", "metric");
CREATE INDEX "EvidenceValue_scenarioId_category_idx" ON "EvidenceValue"("scenarioId", "category");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
