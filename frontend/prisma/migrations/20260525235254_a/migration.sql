/*
  Warnings:

  - A unique constraint covering the columns `[share_token]` on the table `hotel_bookings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "hotel_bookings" ADD COLUMN "deposit" TEXT;
ALTER TABLE "hotel_bookings" ADD COLUMN "room_type" TEXT;
ALTER TABLE "hotel_bookings" ADD COLUMN "share_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "hotel_bookings_share_token_key" ON "hotel_bookings"("share_token");
