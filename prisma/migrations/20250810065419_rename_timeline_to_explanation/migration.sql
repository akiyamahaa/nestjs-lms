/*
  Warnings:

  - You are about to drop the column `timeline` on the `ordering_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ordering_items" DROP COLUMN "timeline",
ADD COLUMN     "explanation" TEXT;
