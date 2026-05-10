import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const visitsTable = pgTable("visits", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id").notNull(),
  clinicId: integer("clinic_id").notNull(),
  vetId: integer("vet_id"),
  type: text("type").notNull().default("outpatient"),
  status: text("status").notNull().default("active"),
  anamnesis: text("anamnesis"),
  therapy: text("therapy"),
  visitDate: text("visit_date").notNull(),
  dischargeDate: text("discharge_date"),
  deposit: numeric("deposit", { precision: 15, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertVisitSchema = createInsertSchema(visitsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVisit = z.infer<typeof insertVisitSchema>;
export type Visit = typeof visitsTable.$inferSelect;

export const visitItemsTable = pgTable("visit_items", {
  id: serial("id").primaryKey(),
  visitId: integer("visit_id").notNull(),
  category: text("category").notNull().default("service"),
  name: text("name").notNull(),
  description: text("description"),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).notNull().default("0"),
  itemDate: text("item_date").notNull().default(""),
  isPaid: boolean("is_paid").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVisitItemSchema = createInsertSchema(visitItemsTable).omit({ id: true, createdAt: true });
export type InsertVisitItem = z.infer<typeof insertVisitItemSchema>;
export type VisitItem = typeof visitItemsTable.$inferSelect;

export const dailyReportsTable = pgTable("daily_reports", {
  id: serial("id").primaryKey(),
  visitId: integer("visit_id").notNull(),
  reportDate: text("report_date").notNull(),
  condition: text("condition"),
  treatment: text("treatment"),
  notes: text("notes"),
  cost: numeric("cost", { precision: 15, scale: 2 }).notNull().default("0"),
  vetId: integer("vet_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDailyReportSchema = createInsertSchema(dailyReportsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDailyReport = z.infer<typeof insertDailyReportSchema>;
export type DailyReport = typeof dailyReportsTable.$inferSelect;
