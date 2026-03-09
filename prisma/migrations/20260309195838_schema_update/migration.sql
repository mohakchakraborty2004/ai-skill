-- AlterTable
ALTER TABLE "DisputeLog" ADD COLUMN     "proposedComplexityWeight" DOUBLE PRECISION,
ADD COLUMN     "proposedDensityWeight" DOUBLE PRECISION,
ADD COLUMN     "proposedSkillWeight" DOUBLE PRECISION,
ADD COLUMN     "weightUpdateApplied" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN     "disputesRemaining" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "PeerRating" ADD COLUMN     "proposedComplexityWeight" DOUBLE PRECISION,
ADD COLUMN     "proposedDensityWeight" DOUBLE PRECISION,
ADD COLUMN     "proposedSkillWeight" DOUBLE PRECISION,
ADD COLUMN     "systemScoreAtTime" INTEGER,
ADD COLUMN     "weightUpdateApplied" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SystemWeights" (
    "id" TEXT NOT NULL DEFAULT 'global_weights',
    "skillWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.50,
    "densityWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.30,
    "complexityWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    "totalUpdates" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemWeights_pkey" PRIMARY KEY ("id")
);
