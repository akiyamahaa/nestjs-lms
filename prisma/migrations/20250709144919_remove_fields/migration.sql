/*
  Warnings:

  - You are about to drop the column `created_by` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `preview_img` on the `products` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_created_by_fkey";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "created_by",
DROP COLUMN "preview_img";
