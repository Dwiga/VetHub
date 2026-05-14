import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, petsTable, speciesTable, monitoringTable, vaccinationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getOrCreateUser } from "./users";
import { getStackUserId } from "../lib/auth";

const router = Router();

async function petWithDetails(pet: typeof petsTable.$inferSelect) {
  const species = await db.query.speciesTable.findFirst({ where: eq(speciesTable.id, pet.speciesId) });
  const owner = await db.query.usersTable.findFirst({ where: eq(usersTable.id, pet.ownerId) });
  return {
    ...pet,
    speciesName: species?.name ?? null,
    ownerName: owner?.name ?? null,
    ownerPhone: owner?.phone ?? null,
  };
}

// GET /api/pets
router.get("/", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(stackId);
  const pets = await db.query.petsTable.findMany({ where: eq(petsTable.ownerId, user.id), orderBy: [desc(petsTable.createdAt)] });
  const result = await Promise.all(pets.map(petWithDetails));
  res.json(result);
});

// POST /api/pets
router.post("/", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(stackId);
  const { name, dateOfBirth, gender, sterilized, color, speciesId, photoUrl } = req.body;
  if (!name || !speciesId) return res.status(400).json({ error: "Name and speciesId are required" });
  const [pet] = await db.insert(petsTable).values({
    name, dateOfBirth, gender: gender || "unknown",
    sterilized: sterilized ?? false, color, speciesId, ownerId: user.id, photoUrl,
  }).returning();
  res.status(201).json(await petWithDetails(pet));
});

// GET /api/pets/:petId
router.get("/:petId", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const pet = await db.query.petsTable.findFirst({ where: eq(petsTable.id, parseInt(req.params.petId)) });
  if (!pet) return res.status(404).json({ error: "Pet not found" });
  res.json(await petWithDetails(pet));
});

// PATCH /api/pets/:petId
router.patch("/:petId", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const petId = parseInt(req.params.petId);
  const { name, dateOfBirth, gender, sterilized, color, speciesId, photoUrl } = req.body;
  const [updated] = await db.update(petsTable).set({
    ...(name !== undefined && { name }),
    ...(dateOfBirth !== undefined && { dateOfBirth }),
    ...(gender !== undefined && { gender }),
    ...(sterilized !== undefined && { sterilized }),
    ...(color !== undefined && { color }),
    ...(speciesId !== undefined && { speciesId }),
    ...(photoUrl !== undefined && { photoUrl }),
  }).where(eq(petsTable.id, petId)).returning();
  if (!updated) return res.status(404).json({ error: "Pet not found" });
  res.json(await petWithDetails(updated));
});

// PATCH /api/pets/:petId/status
router.patch("/:petId/status", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const petId = parseInt(req.params.petId);
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: "Status is required" });
  const [updated] = await db.update(petsTable).set({ status }).where(eq(petsTable.id, petId)).returning();
  if (!updated) return res.status(404).json({ error: "Pet not found" });
  res.json(await petWithDetails(updated));
});

// GET /api/pets/:petId/monitoring
router.get("/:petId/monitoring", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const petId = parseInt(req.params.petId);
  const records = await db.query.monitoringTable.findMany({
    where: eq(monitoringTable.petId, petId),
    orderBy: [desc(monitoringTable.recordedAt)],
    limit: 10,
  });
  res.json(records.map(r => ({
    ...r,
    weight: r.weight ? parseFloat(r.weight) : null,
    height: r.height ? parseFloat(r.height) : null,
    temperature: r.temperature ? parseFloat(r.temperature) : null,
  })));
});

// POST /api/pets/:petId/monitoring
router.post("/:petId/monitoring", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(stackId);
  const petId = parseInt(req.params.petId);
  const { weight, height, temperature, notes } = req.body;
  const [record] = await db.insert(monitoringTable).values({
    petId,
    weight: weight !== undefined ? String(weight) : undefined,
    height: height !== undefined ? String(height) : undefined,
    temperature: temperature !== undefined ? String(temperature) : undefined,
    notes,
    recordedBy: user.name ?? user.email ?? stackId,
  }).returning();
  res.status(201).json({
    ...record,
    weight: record.weight ? parseFloat(record.weight) : null,
    height: record.height ? parseFloat(record.height) : null,
    temperature: record.temperature ? parseFloat(record.temperature) : null,
  });
});

// GET /api/pets/:petId/visits
router.get("/:petId/visits", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const petId = parseInt(req.params.petId);
  const { visitsTable, visitItemsTable, dailyReportsTable } = await import("@workspace/db");
  const visits = await db.query.visitsTable.findMany({
    where: eq(visitsTable.petId, petId),
    orderBy: [desc(visitsTable.createdAt)],
  });
  const result = await Promise.all(visits.map(async v => {
    const pet = await db.query.petsTable.findFirst({ where: eq(petsTable.id, v.petId) });
    const items = await db.query.visitItemsTable.findMany({ where: eq(visitItemsTable.visitId, v.id) });
    const reports = await db.query.dailyReportsTable.findMany({ where: eq(dailyReportsTable.visitId, v.id) });
    const totalCost = items.reduce((s, i) => s + parseFloat(i.unitPrice) * parseFloat(i.quantity), 0)
      + reports.reduce((s, r) => s + parseFloat(r.cost), 0);
    let vetName = null;
    if (v.vetId) {
      const vet = await db.query.usersTable.findFirst({ where: eq(usersTable.id, v.vetId) });
      vetName = vet?.name ?? null;
    }
    return { ...v, petName: pet?.name ?? null, vetName, totalCost };
  }));
  res.json(result);
});

// POST /api/pets/:petId/visits
router.post("/:petId/visits", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const petId = parseInt(req.params.petId);
  const { clinicId, vetId, type, anamnesis, therapy, visitDate } = req.body;
  if (!clinicId || !type) return res.status(400).json({ error: "clinicId and type are required" });
  const { visitsTable } = await import("@workspace/db");
  const today = visitDate || new Date().toISOString().split("T")[0];
  const [visit] = await db.insert(visitsTable).values({
    petId, clinicId, vetId, type, anamnesis, therapy, visitDate: today, status: "active",
  }).returning();
  if (type === "inpatient") {
    await db.update(petsTable).set({ status: "hospitalized" }).where(eq(petsTable.id, petId));
  } else {
    await db.update(petsTable).set({ status: "sick" }).where(eq(petsTable.id, petId));
  }
  const pet = await db.query.petsTable.findFirst({ where: eq(petsTable.id, petId) });
  let vetName = null;
  if (vetId) {
    const vet = await db.query.usersTable.findFirst({ where: eq(usersTable.id, vetId) });
    vetName = vet?.name ?? null;
  }
  res.status(201).json({ ...visit, petName: pet?.name ?? null, vetName, totalCost: 0 });
});

// GET /api/pets/:petId/vaccinations
router.get("/:petId/vaccinations", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const petId = parseInt(req.params.petId);
  const records = await db.query.vaccinationsTable.findMany({
    where: eq(vaccinationsTable.petId, petId),
    orderBy: [desc(vaccinationsTable.date)],
  });
  res.json(records.map(r => ({ ...r, cost: r.cost ? parseFloat(r.cost) : null })));
});

// POST /api/pets/:petId/vaccinations
router.post("/:petId/vaccinations", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(stackId);
  const petId = parseInt(req.params.petId);
  const { vaccineName, brand, date, nextDueDate, batchNumber, administeredBy, cost, notes } = req.body;
  if (!vaccineName || !date) return res.status(400).json({ error: "vaccineName and date are required" });
  const [record] = await db.insert(vaccinationsTable).values({
    petId, vaccineName, brand, date, nextDueDate, batchNumber,
    administeredBy: administeredBy ?? user.name,
    cost: cost !== undefined && cost !== null ? String(cost) : null,
    notes, vetId: user.id,
  }).returning();
  res.status(201).json({ ...record, cost: record.cost ? parseFloat(record.cost) : null });
});

export default router;
