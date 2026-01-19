/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Goal` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Goal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "Priority" ADD VALUE 'URGENT';

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "priority" DROP NOT NULL,
ALTER COLUMN "priority" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Goal_code_key" ON "Goal"("code");
