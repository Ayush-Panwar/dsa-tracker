-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "externalId" TEXT;

-- CreateIndex
CREATE INDEX "Submission_externalId_idx" ON "Submission"("externalId");
