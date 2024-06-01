/*
  Warnings:

  - Changed the type of `result` on the `Submission` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "result",
ADD COLUMN     "result" TEXT NOT NULL;

-- DropEnum
DROP TYPE "Result";

-- CreateTable
CREATE TABLE "ResponseTestCase" (
    "id" SERIAL NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "userOutput" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "submissionId" INTEGER NOT NULL,

    CONSTRAINT "ResponseTestCase_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ResponseTestCase" ADD CONSTRAINT "ResponseTestCase_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
