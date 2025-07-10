-- AlterTable
ALTER TABLE "Error" ADD COLUMN     "aiAnalysis" JSONB,
ADD COLUMN     "columnNumber" INTEGER,
ADD COLUMN     "errorSubtype" TEXT,
ADD COLUMN     "snippetContext" TEXT,
ADD COLUMN     "suggestedFix" TEXT;

-- CreateTable
CREATE TABLE "TestCase" (
    "id" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "problemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorPattern" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErrorPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolutionVersion" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "changelog" TEXT,
    "submissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolutionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ErrorToErrorPattern" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ErrorToErrorPattern_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "ErrorPattern_userId_idx" ON "ErrorPattern"("userId");

-- CreateIndex
CREATE INDEX "_ErrorToErrorPattern_B_index" ON "_ErrorToErrorPattern"("B");

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorPattern" ADD CONSTRAINT "ErrorPattern_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolutionVersion" ADD CONSTRAINT "SolutionVersion_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ErrorToErrorPattern" ADD CONSTRAINT "_ErrorToErrorPattern_A_fkey" FOREIGN KEY ("A") REFERENCES "Error"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ErrorToErrorPattern" ADD CONSTRAINT "_ErrorToErrorPattern_B_fkey" FOREIGN KEY ("B") REFERENCES "ErrorPattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;
