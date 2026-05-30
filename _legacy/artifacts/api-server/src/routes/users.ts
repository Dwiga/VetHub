import { Router } from "express";
import { getAuth, createClerkClient } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, clinicsTable, adminsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

async function syncEmailFromClerk(clerkId: string): Promise<string | undefined> {
  try {
    const clerkUser = await clerk.users.getUser(clerkId);
    return clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress;
  } catch {
    return undefined;
  }
}

async function getOrCreateUser(clerkId: string) {
  let user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });
  if (!user) {
    const email = await syncEmailFromClerk(clerkId);
    const [created] = await db.insert(usersTable).values({ clerkId, email }).returning();
    user = created;
  } else if (!user.email) {
    const email = await syncEmailFromClerk(clerkId);
    if (email) {
      const [updated] = await db.update(usersTable).set({ email }).where(eq(usersTable.id, user.id)).returning();
      user = updated;
    }
  }
  return user;
}

function buildUserProfile(user: typeof usersTable.$inferSelect, isAdmin = false) {
  let role = "none";
  if (user.isPetOwner && user.isVetOwner) role = "both";
  else if (user.isPetOwner) role = "pet_owner";
  else if (user.isVetOwner) role = "vet_owner";
  else if (user.isVet) role = "vet";
  return {
    id: user.id,
    clerkId: user.clerkId,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role,
    isPetOwner: user.isPetOwner,
    isVet: user.isVet,
    isVetOwner: user.isVetOwner,
    isHotelOwner: user.isHotelOwner,
    vetStatus: user.vetStatus ?? null,
    clinicId: user.clinicId,
    hotelId: user.hotelId,
    isAdmin,
    createdAt: user.createdAt,
  };
}

async function checkIsAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const admin = await db.query.adminsTable.findFirst({ where: eq(adminsTable.email, email) });
  return !!admin;
}

// GET /api/users/me
router.get("/me", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(clerkId);
  const isAdmin = await checkIsAdmin(user.email);
  res.json(buildUserProfile(user, isAdmin));
});

// PATCH /api/users/me
router.patch("/me", async (req, res, next) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(clerkId);
  const { name, phone } = req.body;
  try {
    const [updated] = await db
      .update(usersTable)
      .set({ ...(name !== undefined && { name }), ...(phone !== undefined && { phone }) })
      .where(eq(usersTable.id, user.id))
      .returning();
    const isAdmin = await checkIsAdmin(updated.email);
    res.json(buildUserProfile(updated, isAdmin));
  } catch (e: any) {
    res.status(500).json({ error: "Nomor hp sudah terdaftar" });
  }
});

// POST /api/users/register-as-pet-owner
router.post("/register-as-pet-owner", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(clerkId);
  const [updated] = await db
    .update(usersTable)
    .set({ isPetOwner: true })
    .where(eq(usersTable.id, user.id))
    .returning();
  const isAdmin = await checkIsAdmin(updated.email);
  res.json(buildUserProfile(updated, isAdmin));
});

// POST /api/users/register-for-hotel
router.post("/register-for-hotel", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(clerkId);
  const { name, address, phone: hotelPhone, email: hotelEmail } = req.body;
  if (!name) return res.status(400).json({ error: "Hotel name is required" });
  const [hotel] = await db
    .insert(clinicsTable)
    .values({ name, address, phone: hotelPhone, email: hotelEmail, ownerId: user.id, type: "hotel" })
    .returning();
  await db.update(usersTable)
    .set({ isHotelOwner: true, hotelId: hotel.id })
    .where(eq(usersTable.id, user.id));
  res.status(201).json(hotel);
});

// POST /api/users/register-for-vet
router.post("/register-for-vet", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(clerkId);
  const { name, address, phone: clinicPhone, email: clinicEmail } = req.body;
  if (!name) return res.status(400).json({ error: "Clinic name is required" });
  const [clinic] = await db
    .insert(clinicsTable)
    .values({ name, address, phone: clinicPhone, email: clinicEmail, ownerId: user.id })
    .returning();
  await db.update(usersTable)
    .set({ isVetOwner: true, clinicId: clinic.id, vetStatus: "pending" })
    .where(eq(usersTable.id, user.id));
  res.status(201).json(clinic);
});

export { getOrCreateUser, buildUserProfile };
export default router;
