import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, petsTable, speciesTable, visitsTable, visitItemsTable, dailyReportsTable } from "@workspace/db";
import { eq, ilike, inArray, desc } from "drizzle-orm";
import { getOrCreateUser } from "./users";
import { normalizePhone, phoneVariants } from "../utils/phone";

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

// GET /api/vet/search-owner?phone=...
router.get("/search-owner", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const phone = req.query.phone as string;
  if (!phone) return res.status(400).json({ error: "phone is required" });
  const variants = phoneVariants(phone);
  const owner = await db.query.usersTable.findFirst({
    where: inArray(usersTable.phone, variants),
  });
  if (!owner) return res.status(404).json({ error: "Owner not found" });
  const pets = await db.query.petsTable.findMany({ where: eq(petsTable.ownerId, owner.id) });
  const petsWithDetails = await Promise.all(pets.map(petWithDetails));
  let role = "none";
  if (owner.isPetOwner && owner.isVetOwner) role = "both";
  else if (owner.isPetOwner) role = "pet_owner";
  else if (owner.isVetOwner) role = "vet_owner";
  else if (owner.isVet) role = "vet";
  res.json({
    owner: {
      id: owner.id, clerkId: owner.clerkId, name: owner.name, phone: owner.phone,
      email: owner.email, role, isPetOwner: owner.isPetOwner, isVet: owner.isVet,
      isVetOwner: owner.isVetOwner, clinicId: owner.clinicId, createdAt: owner.createdAt,
    },
    pets: petsWithDetails,
  });
});

// GET /api/vet/search-pet?name=...&clinicId=...
router.get("/search-pet", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const name = req.query.name as string;
  if (!name) return res.status(400).json({ error: "name is required" });
  const pets = await db.query.petsTable.findMany({ where: ilike(petsTable.name, `%${name}%`) });
  const result = await Promise.all(pets.map(async (pet) => {
    const species = await db.query.speciesTable.findFirst({ where: eq(speciesTable.id, pet.speciesId) });
    const owner = await db.query.usersTable.findFirst({ where: eq(usersTable.id, pet.ownerId) });
    return {
      id: pet.id, name: pet.name, speciesName: species?.name ?? null,
      gender: pet.gender, status: pet.status, color: pet.color, photoUrl: pet.photoUrl,
      ownerId: pet.ownerId, ownerName: owner?.name ?? null, ownerPhone: owner?.phone ?? null,
    };
  }));
  res.json(result);
});

// POST /api/vet/add-pet-for-owner
router.post("/add-pet-for-owner", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const { ownerPhone, name, dateOfBirth, gender, sterilized, color, speciesId } = req.body;
  if (!ownerPhone || !name || !speciesId) return res.status(400).json({ error: "ownerPhone, name, speciesId required" });
  const canonicalPhone = normalizePhone(ownerPhone);
  const variants = phoneVariants(ownerPhone);
  let owner = await db.query.usersTable.findFirst({ where: inArray(usersTable.phone, variants) });
  if (!owner) {
    const [created] = await db.insert(usersTable).values({
      clerkId: `phone_${canonicalPhone}_${Date.now()}`, phone: canonicalPhone, isPetOwner: true,
    }).returning();
    owner = created;
  } else if (!owner.isPetOwner) {
    await db.update(usersTable).set({ isPetOwner: true }).where(eq(usersTable.id, owner.id));
  }
  const [pet] = await db.insert(petsTable).values({
    name, dateOfBirth, gender: gender || "unknown",
    sterilized: sterilized ?? false, color, speciesId, ownerId: owner.id,
  }).returning();
  const species = await db.query.speciesTable.findFirst({ where: eq(speciesTable.id, pet.speciesId) });
  res.status(201).json({
    ...pet, speciesName: species?.name ?? null,
    ownerName: owner.name, ownerPhone: owner.phone,
  });
});

// GET /api/vet/visits?clinicId=... — all visits for a clinic (history)
router.get("/visits", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const clinicId = parseInt(req.query.clinicId as string);
  if (!clinicId) return res.status(400).json({ error: "clinicId is required" });

  const visits = await db.query.visitsTable.findMany({
    where: eq(visitsTable.clinicId, clinicId),
    orderBy: [desc(visitsTable.visitDate), desc(visitsTable.createdAt)],
  });

  const result = await Promise.all(visits.map(async (v) => {
    const pet = await db.query.petsTable.findFirst({ where: eq(petsTable.id, v.petId) });
    const items = await db.query.visitItemsTable.findMany({ where: eq(visitItemsTable.visitId, v.id) });
    const reports = await db.query.dailyReportsTable.findMany({ where: eq(dailyReportsTable.visitId, v.id) });
    const totalCost = items.reduce((s, i) => s + parseFloat(String(i.unitPrice ?? 0)) * parseFloat(String(i.quantity ?? 1)), 0)
      + reports.reduce((s, r) => s + parseFloat(String(r.cost ?? 0)), 0);
    let vetName = null;
    if (v.vetId) {
      const vet = await db.query.usersTable.findFirst({ where: eq(usersTable.id, v.vetId) });
      vetName = vet?.name ?? null;
    }
    return {
      id: v.id,
      petId: v.petId,
      petName: pet?.name ?? null,
      clinicId: v.clinicId,
      type: v.type,
      status: v.status,
      visitDate: v.visitDate,
      totalCost,
      vetId: v.vetId ?? null,
      vetName,
      createdAt: v.createdAt,
    };
  }));

  res.json(result);
});

export default router;
