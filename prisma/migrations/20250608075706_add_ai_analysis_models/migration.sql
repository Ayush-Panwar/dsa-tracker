-- CreateTable
CREATE TABLE "CodeChange" (
    "id" TEXT NOT NULL,
    "addedLines" INTEGER NOT NULL DEFAULT 0,
    "removedLines" INTEGER NOT NULL DEFAULT 0,
    "modifiedLines" INTEGER NOT NULL DEFAULT 0,
    "solutionVersionId" TEXT NOT NULL,
    "aiAnalysis" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAnalysis" (
    "id" TEXT NOT NULL,
    "analysisType" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "problemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rootCause" TEXT,
    "aiSuggestion" TEXT,
    "frequency" INTEGER NOT NULL DEFAULT 0,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "problemIds" TEXT[],
    "languages" TEXT[],

    CONSTRAINT "ErrorGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "errorFrequencyTrend" JSONB,
    "problemSolvedTrend" JSONB,
    "languageProficiency" JSONB,
    "lastAnalysisDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CodeChange_solutionVersionId_key" ON "CodeChange"("solutionVersionId");

-- CreateIndex
CREATE INDEX "AiAnalysis_userId_idx" ON "AiAnalysis"("userId");

-- CreateIndex
CREATE INDEX "AiAnalysis_problemId_idx" ON "AiAnalysis"("problemId");

-- CreateIndex
CREATE INDEX "AiAnalysis_analysisType_idx" ON "AiAnalysis"("analysisType");

-- CreateIndex
CREATE INDEX "ErrorGroup_userId_idx" ON "ErrorGroup"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProgress_userId_key" ON "UserProgress"("userId");

-- CreateIndex
CREATE INDEX "UserProgress_userId_idx" ON "UserProgress"("userId");

-- AddForeignKey
ALTER TABLE "CodeChange" ADD CONSTRAINT "CodeChange_solutionVersionId_fkey" FOREIGN KEY ("solutionVersionId") REFERENCES "SolutionVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAnalysis" ADD CONSTRAINT "AiAnalysis_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAnalysis" ADD CONSTRAINT "AiAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorGroup" ADD CONSTRAINT "ErrorGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
