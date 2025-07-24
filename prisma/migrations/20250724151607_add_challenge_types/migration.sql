/*
  Warnings:

  - The values [assignment,exam] on the enum `ChallengeType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ChallengeType_new" AS ENUM ('quiz', 'puzzle', 'ordering', 'fillBlank');
ALTER TABLE "Challenge" ALTER COLUMN "type" TYPE "ChallengeType_new" USING ("type"::text::"ChallengeType_new");
ALTER TYPE "ChallengeType" RENAME TO "ChallengeType_old";
ALTER TYPE "ChallengeType_new" RENAME TO "ChallengeType";
DROP TYPE "ChallengeType_old";
COMMIT;

-- CreateTable
CREATE TABLE "puzzle_challenges" (
    "id" UUID NOT NULL,
    "challenge_id" UUID NOT NULL,
    "instruction" TEXT NOT NULL,
    "image" TEXT NOT NULL,

    CONSTRAINT "puzzle_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordering_challenges" (
    "id" UUID NOT NULL,
    "challenge_id" UUID NOT NULL,
    "instruction" TEXT NOT NULL,

    CONSTRAINT "ordering_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordering_items" (
    "id" UUID NOT NULL,
    "ordering_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "correct_order" INTEGER NOT NULL,

    CONSTRAINT "ordering_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fill_blank_challenges" (
    "id" UUID NOT NULL,
    "challenge_id" UUID NOT NULL,

    CONSTRAINT "fill_blank_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fill_blank_questions" (
    "id" UUID NOT NULL,
    "challenge_id" UUID NOT NULL,
    "sentence" TEXT NOT NULL,
    "correct_word" TEXT NOT NULL,

    CONSTRAINT "fill_blank_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "puzzle_challenges_challenge_id_key" ON "puzzle_challenges"("challenge_id");

-- CreateIndex
CREATE UNIQUE INDEX "ordering_challenges_challenge_id_key" ON "ordering_challenges"("challenge_id");

-- CreateIndex
CREATE UNIQUE INDEX "fill_blank_challenges_challenge_id_key" ON "fill_blank_challenges"("challenge_id");

-- AddForeignKey
ALTER TABLE "puzzle_challenges" ADD CONSTRAINT "puzzle_challenges_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordering_challenges" ADD CONSTRAINT "ordering_challenges_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordering_items" ADD CONSTRAINT "ordering_items_ordering_id_fkey" FOREIGN KEY ("ordering_id") REFERENCES "ordering_challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fill_blank_challenges" ADD CONSTRAINT "fill_blank_challenges_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fill_blank_questions" ADD CONSTRAINT "fill_blank_questions_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "fill_blank_challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
