/*
  Warnings:

  - You are about to drop the `CodeAnnotation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CodeAnnotation" DROP CONSTRAINT "CodeAnnotation_submissionId_fkey";

-- DropTable
DROP TABLE "CodeAnnotation";

-- CreateTable
CREATE TABLE "SubmissionAnnotation" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "startLine" INTEGER NOT NULL,
    "startColumn" INTEGER,
    "endLine" INTEGER NOT NULL,
    "endColumn" INTEGER,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissionAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubmissionAnnotation_submissionId_idx" ON "SubmissionAnnotation"("submissionId");

-- AddForeignKey
ALTER TABLE "SubmissionAnnotation" ADD CONSTRAINT "SubmissionAnnotation_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
