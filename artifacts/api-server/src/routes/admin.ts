import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, speciesTable, adminsTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";

const router = Router();

async function getAdminForRequest(req: any): Promise<boolean> {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return false;
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });
  if (!user?.email) return false;
  const admin = await db.query.adminsTable.findFirst({ where: eq(adminsTable.email, user.email) });
  return !!admin;
}

async function requireAdmin(req: any, res: any, next: any) {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const isAdmin = await getAdminForRequest(req);
  if (!isAdmin) return res.status(403).json({ error: "Forbidden" });
  next();
}

// GET /api/admin/me — check if current user is admin (no requireAdmin guard so anyone can call it)
router.get("/me", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.json({ isAdmin: false });
  const isAdmin = await getAdminForRequest(req);
  res.json({ isAdmin });
});

// GET /api/admin/vets — list all vet registrations
router.get("/vets", requireAdmin, async (req, res) => {
  const vets = await db.query.usersTable.findMany({
    where: or(eq(usersTable.isVet, true), eq(usersTable.isVetOwner, true)),
    orderBy: (u, { asc }) => [asc(u.createdAt)],
  });
  res.json(vets.map(v => ({
    id: v.id,
    name: v.name,
    email: v.email,
    phone: v.phone,
    isVet: v.isVet,
    isVetOwner: v.isVetOwner,
    vetStatus: v.vetStatus,
    clinicId: v.clinicId,
    createdAt: v.createdAt,
  })));
});

// PATCH /api/admin/vets/:userId — approve or reject
router.patch("/vets/:userId", requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.userId);
  const { vetStatus } = req.body;
  if (!["approved", "rejected", "pending"].includes(vetStatus)) {
    return res.status(400).json({ error: "vetStatus must be approved, rejected, or pending" });
  }
  const [updated] = await db.update(usersTable).set({ vetStatus }).where(eq(usersTable.id, userId)).returning();
  if (!updated) return res.status(404).json({ error: "User not found" });
  res.json({ id: updated.id, name: updated.name, email: updated.email, vetStatus: updated.vetStatus });
});

// POST /api/admin/species — add species
router.post("/species", requireAdmin, async (req, res) => {
  const { name, icon } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  const [species] = await db.insert(speciesTable).values({ name, icon }).returning();
  res.status(201).json(species);
});

// DELETE /api/admin/species/:speciesId
router.delete("/species/:speciesId", requireAdmin, async (req, res) => {
  const speciesId = parseInt(req.params.speciesId);
  const [deleted] = await db.delete(speciesTable).where(eq(speciesTable.id, speciesId)).returning();
  if (!deleted) return res.status(404).json({ error: "Species not found" });
  res.status(204).send();
});

// GET /api/admin/admins
router.get("/admins", requireAdmin, async (req, res) => {
  const admins = await db.query.adminsTable.findMany({ orderBy: (a, { asc }) => [asc(a.createdAt)] });
  res.json(admins);
});

// POST /api/admin/admins
router.post("/admins", requireAdmin, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });
  const [admin] = await db.insert(adminsTable).values({ email }).returning();
  res.status(201).json(admin);
});

// DELETE /api/admin/admins/:adminId
router.delete("/admins/:adminId", requireAdmin, async (req, res) => {
  const adminId = parseInt(req.params.adminId);
  const [deleted] = await db.delete(adminsTable).where(eq(adminsTable.id, adminId)).returning();
  if (!deleted) return res.status(404).json({ error: "Admin not found" });
  res.status(204).send();
});

export default router;
