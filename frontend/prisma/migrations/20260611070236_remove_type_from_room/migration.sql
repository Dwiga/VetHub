/*
  Warnings:

  - You are about to drop the column `type` on the `rooms` table. All the data in the column will be lost.
  - Made the column `capacity` on table `rooms` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "rooms" DROP COLUMN "type",
ALTER COLUMN "capacity" SET NOT NULL,
ALTER COLUMN "capacity" SET DEFAULT 1;
