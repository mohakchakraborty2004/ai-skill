-- CreateTable
CREATE TABLE "PeerRating" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "humanScore" INTEGER NOT NULL,
    "reviewerRole" TEXT NOT NULL,
    "remarks" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PeerRating_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PeerRating" ADD CONSTRAINT "PeerRating_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
