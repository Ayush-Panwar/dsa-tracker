/*
  Warnings:

  - You are about to drop the `SubmissionAnnotation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SubmissionAnnotation" DROP CONSTRAINT "SubmissionAnnotation_submissionId_fkey";

-- AlterTable
ALTER TABLE "Statistics" ADD COLUMN     "longestStreak" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "SubmissionAnnotation";
