-- CreateTable
CREATE TABLE "CodeAnnotation" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "startLine" INTEGER NOT NULL,
    "startColumn" INTEGER NOT NULL,
    "endLine" INTEGER NOT NULL,
    "endColumn" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodeAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CodeAnnotation_submissionId_idx" ON "CodeAnnotation"("submissionId");

-- AddForeignKey
ALTER TABLE "CodeAnnotation" ADD CONSTRAINT "CodeAnnotation_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
