-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'ANALYST',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "destinationName" TEXT NOT NULL,
    "siteName" TEXT,
    "lat" REAL,
    "lon" REAL,
    "countryCode" TEXT,
    "interventionType" TEXT NOT NULL,
    "productClass" TEXT NOT NULL,
    "productSubtype" TEXT,
    "proponent" TEXT,
    "deliveryModel" TEXT,
    "strategicObjective" TEXT,
    "targetDate" DATETIME,
    "decisionRequired" TEXT,
    "decisionDate" DATETIME,
    "sponsor" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'BRIEF',
    "ownerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Scenario_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "uploadedById" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "Upload_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScenarioVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "inputsSnapshot" TEXT NOT NULL,
    "resultsSnapshot" TEXT,
    "scenarioCase" TEXT NOT NULL DEFAULT 'BASE',
    "recommendation" TEXT,
    "recommendationRationale" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScenarioVersion_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScenarioVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScenarioVersion_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EvidenceValue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioVersionId" TEXT NOT NULL,
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
    CONSTRAINT "EvidenceValue_scenarioVersionId_fkey" FOREIGN KEY ("scenarioVersionId") REFERENCES "ScenarioVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EvidenceValue_overriddenById_fkey" FOREIGN KEY ("overriddenById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GateResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioVersionId" TEXT NOT NULL,
    "gate" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "rationale" TEXT NOT NULL,
    "evidenceRefs" TEXT,
    "evaluatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GateResult_scenarioVersionId_fkey" FOREIGN KEY ("scenarioVersionId") REFERENCES "ScenarioVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RiskItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioVersionId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "likelihood" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "inherentRating" TEXT NOT NULL,
    "mitigation" TEXT,
    "owner" TEXT,
    "dueDate" DATETIME,
    "residualRating" TEXT,
    "isDecisionGate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RiskItem_scenarioVersionId_fkey" FOREIGN KEY ("scenarioVersionId") REFERENCES "ScenarioVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConfigVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "valueJson" TEXT NOT NULL,
    "effectiveFrom" DATETIME NOT NULL,
    "approvedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AuditLogEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLogEntry_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLogEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Scenario_stage_idx" ON "Scenario"("stage");

-- CreateIndex
CREATE INDEX "Scenario_productClass_idx" ON "Scenario"("productClass");

-- CreateIndex
CREATE INDEX "ScenarioVersion_scenarioId_idx" ON "ScenarioVersion"("scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioVersion_scenarioId_versionNumber_scenarioCase_key" ON "ScenarioVersion"("scenarioId", "versionNumber", "scenarioCase");

-- CreateIndex
CREATE INDEX "EvidenceValue_scenarioVersionId_metric_idx" ON "EvidenceValue"("scenarioVersionId", "metric");

-- CreateIndex
CREATE UNIQUE INDEX "GateResult_scenarioVersionId_gate_key" ON "GateResult"("scenarioVersionId", "gate");

-- CreateIndex
CREATE INDEX "ConfigVersion_key_effectiveFrom_idx" ON "ConfigVersion"("key", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "ConfigVersion_key_version_key" ON "ConfigVersion"("key", "version");

-- CreateIndex
CREATE INDEX "AuditLogEntry_scenarioId_idx" ON "AuditLogEntry"("scenarioId");

-- CreateIndex
CREATE INDEX "AuditLogEntry_createdAt_idx" ON "AuditLogEntry"("createdAt");
