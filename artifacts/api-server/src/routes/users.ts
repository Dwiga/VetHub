import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, clinicsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getStackUserId } from "../lib/auth";

const router = Router();

async function getOrCreateUser(stackId: string, email?: string) {
  let user = await db.query.usersTable.findFirst({
    where: eq(usersTable.stackId, stackId),
  });
  if (!user) {
    const [created] = await db
      .insert(usersTable)
      .values({ stackId, email })
      .returning();
    user = created;
  }
  return user;
}

function buildUserProfile(user: typeof usersTable.$inferSelect) {
  let role = "none";
  if (user.isPetOwner && user.isVetOwner) role = "both";
  else if (user.isPetOwner) role = "pet_owner";
  else if (user.isVetOwner) role = "vet_owner";
  else if (user.isVet) role = "vet";
  return {
    id: user.id,
    stackId: user.stackId,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role,
    isPetOwner: user.isPetOwner,
    isVet: user.isVet,
    isVetOwner: user.isVetOwner,
    clinicId: user.clinicId,
    createdAt: user.createdAt,
  };
}

// GET /api/users/me
router.get("/me", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(stackId);
  res.json(buildUserProfile(user));
});

// PATCH /api/users/me
router.patch("/me", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(stackId);
  const { name, phone } = req.body;
  const [updated] = await db
    .update(usersTable)
    .set({
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
    })
    .where(eq(usersTable.id, user.id))
    .returning();
  res.json(buildUserProfile(updated));
});

// POST /api/users/register-as-pet-owner
router.post("/register-as-pet-owner", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(stackId);
  const [updated] = await db
    .update(usersTable)
    .set({ isPetOwner: true })
    .where(eq(usersTable.id, user.id))
    .returning();
  res.json(buildUserProfile(updated));
});

// POST /api/users/register-for-vet
router.post("/register-for-vet", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(stackId);
  const { name, address, phone: clinicPhone, email: clinicEmail } = req.body;
  if (!name) return res.status(400).json({ error: "Clinic name is required" });
  const [clinic] = await db
    .insert(clinicsTable)
    .values({
      name,
      address,
      phone: clinicPhone,
      email: clinicEmail,
      ownerId: user.id,
    })
    .returning();
  await db
    .update(usersTable)
    .set({ isVetOwner: true, clinicId: clinic.id })
    .where(eq(usersTable.id, user.id));
  res.status(201).json(clinic);
});

export { getOrCreateUser, buildUserProfile };
export default router;
