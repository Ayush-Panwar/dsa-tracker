-- CreateIndex
CREATE INDEX "ProblemTag_problemId_idx" ON "ProblemTag"("problemId");

-- CreateIndex
CREATE INDEX "ProblemTag_tagId_idx" ON "ProblemTag"("tagId");

-- CreateIndex
CREATE INDEX "Submission_submittedAt_idx" ON "Submission"("submittedAt");
