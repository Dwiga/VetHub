import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { hotelBookingsTable, hotelDailyLogsTable, petsTable, usersTable, speciesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getOrCreateUser } from "./users";

const router = Router();

async function bookingWithDetails(booking: typeof hotelBookingsTable.$inferSelect) {
  const pet = await db.query.petsTable.findFirst({ where: eq(petsTable.id, booking.petId) });
  const species = pet ? await db.query.speciesTable.findFirst({ where: eq(speciesTable.id, pet.speciesId) }) : null;
  const owner = pet ? await db.query.usersTable.findFirst({ where: eq(usersTable.id, pet.ownerId) }) : null;
  const logs = await db.query.hotelDailyLogsTable.findMany({ where: eq(hotelDailyLogsTable.bookingId, booking.id) });

  const checkOut = booking.checkOut;
  let totalDays: number | null = null;
  if (checkOut) {
    const d1 = new Date(booking.checkIn);
    const d2 = new Date(checkOut);
    totalDays = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
  }

  const dailyFeeAmount = booking.dailyFee ? parseFloat(booking.dailyFee) : 0;
  const logsCost = logs.reduce((sum, l) => sum + parseFloat(l.cost), 0);
  const daysForCalc = totalDays ?? 0;
  const totalCost = daysForCalc * dailyFeeAmount + logsCost;

  return {
    ...booking,
    dailyFee: booking.dailyFee ? parseFloat(booking.dailyFee) : null,
    petName: pet?.name ?? null,
    petSpecies: species?.name ?? null,
    ownerName: owner?.name ?? null,
    ownerPhone: owner?.phone ?? null,
    totalDays,
    totalCost,
  };
}

// GET /api/hotel/:bookingId
router.get("/:bookingId", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const bookingId = parseInt(req.params.bookingId);
  const booking = await db.query.hotelBookingsTable.findFirst({ where: eq(hotelBookingsTable.id, bookingId) });
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  res.json(await bookingWithDetails(booking));
});

// PATCH /api/hotel/:bookingId
router.patch("/:bookingId", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const bookingId = parseInt(req.params.bookingId);
  const { checkOut, status, dailyFee, notes } = req.body;
  const updateData: Record<string, unknown> = {};
  if (checkOut !== undefined) updateData.checkOut = checkOut;
  if (status !== undefined) updateData.status = status;
  if (dailyFee !== undefined) updateData.dailyFee = String(dailyFee);
  if (notes !== undefined) updateData.notes = notes;
  const [updated] = await db.update(hotelBookingsTable)
    .set(updateData)
    .where(eq(hotelBookingsTable.id, bookingId))
    .returning();
  if (!updated) return res.status(404).json({ error: "Booking not found" });
  res.json(await bookingWithDetails(updated));
});

// GET /api/hotel/:bookingId/logs
router.get("/:bookingId/logs", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const bookingId = parseInt(req.params.bookingId);
  const logs = await db.query.hotelDailyLogsTable.findMany({
    where: eq(hotelDailyLogsTable.bookingId, bookingId),
    orderBy: [desc(hotelDailyLogsTable.logDate)],
  });
  res.json(logs.map(l => ({ ...l, cost: parseFloat(l.cost) })));
});

// POST /api/hotel/:bookingId/logs
router.post("/:bookingId/logs", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const bookingId = parseInt(req.params.bookingId);
  const { logDate, condition, feeding, notes, cost } = req.body;
  if (!logDate) return res.status(400).json({ error: "logDate is required" });
  const [log] = await db.insert(hotelDailyLogsTable).values({
    bookingId,
    logDate,
    condition: condition || null,
    feeding: feeding || null,
    notes: notes || null,
    cost: cost !== undefined ? String(cost) : "0",
  }).returning();
  res.status(201).json({ ...log, cost: parseFloat(log.cost) });
});

// DELETE /api/hotel/:bookingId/logs/:logId
router.delete("/:bookingId/logs/:logId", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const logId = parseInt(req.params.logId);
  await db.delete(hotelDailyLogsTable).where(eq(hotelDailyLogsTable.id, logId));
  res.status(204).send();
});

export default router;
