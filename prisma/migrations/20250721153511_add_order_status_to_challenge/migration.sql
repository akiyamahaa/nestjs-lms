/*
  Warnings:

  - You are about to drop the column `order` on the `ChallengeQuestion` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('draft', 'published', 'archived');

-- AlterTable
ALTER TABLE "Challenge" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "ChallengeStatus" NOT NULL DEFAULT 'draft';

-- AlterTable
ALTER TABLE "ChallengeQuestion" DROP COLUMN "order";
