/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Evaluation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `baselineScore` to the `Evaluation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN     "baselineScore" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "DisputeLog" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "userClaim" TEXT NOT NULL,
    "aiReasoning" TEXT NOT NULL,
    "scoreDelta" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_userId_key" ON "Evaluation"("userId");

-- AddForeignKey
ALTER TABLE "DisputeLog" ADD CONSTRAINT "DisputeLog_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
