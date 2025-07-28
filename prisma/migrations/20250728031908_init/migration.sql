/*
  Warnings:

  - You are about to drop the `Challenge` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChallengeAnswer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChallengeQuestion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChallengeAnswer" DROP CONSTRAINT "ChallengeAnswer_challenge_question_id_fkey";

-- DropForeignKey
ALTER TABLE "ChallengeQuestion" DROP CONSTRAINT "ChallengeQuestion_challenge_id_fkey";

-- DropForeignKey
ALTER TABLE "fill_blank_challenges" DROP CONSTRAINT "fill_blank_challenges_challenge_id_fkey";

-- DropForeignKey
ALTER TABLE "ordering_challenges" DROP CONSTRAINT "ordering_challenges_challenge_id_fkey";

-- DropForeignKey
ALTER TABLE "puzzle_challenges" DROP CONSTRAINT "puzzle_challenges_challenge_id_fkey";

-- DropTable
DROP TABLE "Challenge";

-- DropTable
DROP TABLE "ChallengeAnswer";

-- DropTable
DROP TABLE "ChallengeQuestion";

-- CreateTable
CREATE TABLE "challenge" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" "ChallengeType" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_question" (
    "id" UUID NOT NULL,
    "challenge_id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "explanation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_answer" (
    "id" UUID NOT NULL,
    "challenge_question_id" UUID NOT NULL,
    "answer" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_lesson_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "user_lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "challenge_slug_key" ON "challenge"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_lesson_progress_user_id_lesson_id_key" ON "user_lesson_progress"("user_id", "lesson_id");

-- AddForeignKey
ALTER TABLE "challenge_question" ADD CONSTRAINT "challenge_question_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_answer" ADD CONSTRAINT "challenge_answer_challenge_question_id_fkey" FOREIGN KEY ("challenge_question_id") REFERENCES "challenge_question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puzzle_challenges" ADD CONSTRAINT "puzzle_challenges_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordering_challenges" ADD CONSTRAINT "ordering_challenges_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fill_blank_challenges" ADD CONSTRAINT "fill_blank_challenges_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
