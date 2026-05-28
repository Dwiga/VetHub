/*
  Warnings:

  - You are about to drop the `monitoring` table. All the data in the column will be lost.
  - You are about to drop the `visit_items` table. All the data in the column will be lost.

*/
-- DropTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
DROP TABLE IF EXISTS "monitoring";
DROP TABLE IF EXISTS "visit_items";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
