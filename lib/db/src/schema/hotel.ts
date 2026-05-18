import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const hotelBookingsTable = pgTable("hotel_bookings", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id").notNull(),
  clinicId: integer("clinic_id").notNull(),
  checkIn: text("check_in").notNull(),
  checkOut: text("check_out"),
  dailyFee: numeric("daily_fee", { precision: 15, scale: 2 }),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertHotelBookingSchema = createInsertSchema(hotelBookingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHotelBooking = z.infer<typeof insertHotelBookingSchema>;
export type HotelBooking = typeof hotelBookingsTable.$inferSelect;

export const hotelDailyLogsTable = pgTable("hotel_daily_logs", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull(),
  logDate: text("log_date").notNull(),
  condition: text("condition"),
  feeding: text("feeding"),
  notes: text("notes"),
  cost: numeric("cost", { precision: 15, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertHotelDailyLogSchema = createInsertSchema(hotelDailyLogsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHotelDailyLog = z.infer<typeof insertHotelDailyLogSchema>;
export type HotelDailyLog = typeof hotelDailyLogsTable.$inferSelect;
