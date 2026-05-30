import { pgTable, unique, serial, text, boolean, integer, timestamp, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	clerkId: text("clerk_id").notNull(),
	name: text(),
	phone: text(),
	email: text(),
	isPetOwner: boolean("is_pet_owner").default(false).notNull(),
	isVet: boolean("is_vet").default(false).notNull(),
	isVetOwner: boolean("is_vet_owner").default(false).notNull(),
	clinicId: integer("clinic_id"),
	vetStatus: text("vet_status"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	isHotelOwner: boolean("is_hotel_owner").default(false).notNull(),
	hotelId: integer("hotel_id"),
}, (table) => [
	unique("users_clerk_id_unique").on(table.clerkId),
	unique("users_phone_unique").on(table.phone),
]);

export const admins = pgTable("admins", {
	id: serial().primaryKey().notNull(),
	email: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("admins_email_unique").on(table.email),
]);

export const staff = pgTable("staff", {
	id: serial().primaryKey().notNull(),
	clinicId: integer("clinic_id").notNull(),
	userId: integer("user_id").notNull(),
	role: text().default('vet').notNull(),
	status: text().default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const species = pgTable("species", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	icon: text(),
}, (table) => [
	unique("species_name_unique").on(table.name),
]);

export const monitoring = pgTable("monitoring", {
	id: serial().primaryKey().notNull(),
	petId: integer("pet_id").notNull(),
	weight: text(),
	height: text(),
	temperature: text(),
	notes: text(),
	recordedBy: text("recorded_by"),
	recordedAt: timestamp("recorded_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const pets = pgTable("pets", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	dateOfBirth: text("date_of_birth"),
	gender: text().default('unknown').notNull(),
	sterilized: boolean().default(false).notNull(),
	color: text(),
	speciesId: integer("species_id").notNull(),
	ownerId: integer("owner_id").notNull(),
	status: text().default('healthy').notNull(),
	photoUrl: text("photo_url"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const vaccinations = pgTable("vaccinations", {
	id: serial().primaryKey().notNull(),
	petId: integer("pet_id").notNull(),
	vaccineName: text("vaccine_name").notNull(),
	brand: text(),
	date: text().notNull(),
	nextDueDate: text("next_due_date"),
	batchNumber: text("batch_number"),
	administeredBy: text("administered_by"),
	cost: numeric({ precision: 15, scale:  2 }),
	notes: text(),
	vetId: integer("vet_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const dailyReports = pgTable("daily_reports", {
	id: serial().primaryKey().notNull(),
	visitId: integer("visit_id").notNull(),
	reportDate: text("report_date").notNull(),
	condition: text(),
	treatment: text(),
	notes: text(),
	cost: numeric({ precision: 15, scale:  2 }).default('0').notNull(),
	vetId: integer("vet_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const visitItems = pgTable("visit_items", {
	id: serial().primaryKey().notNull(),
	visitId: integer("visit_id").notNull(),
	category: text().default('service').notNull(),
	name: text().notNull(),
	description: text(),
	quantity: numeric({ precision: 10, scale:  2 }).default('1').notNull(),
	unitPrice: numeric("unit_price", { precision: 15, scale:  2 }).default('0').notNull(),
	itemDate: text("item_date").default(').notNull(),
	isPaid: boolean("is_paid").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const visits = pgTable("visits", {
	id: serial().primaryKey().notNull(),
	petId: integer("pet_id").notNull(),
	clinicId: integer("clinic_id").notNull(),
	vetId: integer("vet_id"),
	type: text().default('outpatient').notNull(),
	status: text().default('active').notNull(),
	anamnesis: text(),
	therapy: text(),
	visitDate: text("visit_date").notNull(),
	dischargeDate: text("discharge_date"),
	deposit: numeric({ precision: 15, scale:  2 }),
	shareToken: text("share_token"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("visits_share_token_unique").on(table.shareToken),
]);

export const products = pgTable("products", {
	id: serial().primaryKey().notNull(),
	clinicId: integer("clinic_id").notNull(),
	name: text().notNull(),
	category: text(),
	description: text(),
	price: numeric({ precision: 15, scale:  2 }).default('0').notNull(),
	stock: integer(),
	unit: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const hotelBookings = pgTable("hotel_bookings", {
	id: serial().primaryKey().notNull(),
	petId: integer("pet_id"),
	clinicId: integer("clinic_id").notNull(),
	guestName: text("guest_name"),
	guestPhone: text("guest_phone"),
	petNameRaw: text("pet_name_raw"),
	petTypeRaw: text("pet_type_raw"),
	checkIn: text("check_in").notNull(),
	checkOut: text("check_out"),
	dailyFee: numeric("daily_fee", { precision: 15, scale:  2 }),
	status: text().default('active').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const hotelDailyLogs = pgTable("hotel_daily_logs", {
	id: serial().primaryKey().notNull(),
	bookingId: integer("booking_id").notNull(),
	logDate: text("log_date").notNull(),
	condition: text(),
	feeding: text(),
	notes: text(),
	cost: numeric({ precision: 15, scale:  2 }).default('0').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const healthEvents = pgTable("health_events", {
	id: serial().primaryKey().notNull(),
	petId: integer("pet_id").notNull(),
	title: text().notNull(),
	notes: text(),
	eventDate: text("event_date").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const clinics = pgTable("clinics", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	address: text(),
	phone: text(),
	email: text(),
	ownerId: integer("owner_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	type: text().default('vet').notNull(),
});
