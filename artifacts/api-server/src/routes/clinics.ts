import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, clinicsTable, staffTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getOrCreateUser } from "./users";

const router = Router();

// GET /api/clinics/mine
router.get("/mine", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(clerkId);
  if (!user.clinicId) return res.status(404).json({ error: "No clinic found" });
  const clinic = await db.query.clinicsTable.findFirst({ where: eq(clinicsTable.id, user.clinicId) });
  if (!clinic) return res.status(404).json({ error: "Clinic not found" });
  res.json(clinic);
});

// PATCH /api/clinics/:clinicId
router.patch("/:clinicId", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(clerkId);
  const clinicId = parseInt(req.params.clinicId);
  const clinic = await db.query.clinicsTable.findFirst({ where: eq(clinicsTable.id, clinicId) });
  if (!clinic) return res.status(404).json({ error: "Clinic not found" });
  if (clinic.ownerId !== user.id) return res.status(403).json({ error: "Forbidden" });
  const { name, address, phone, email } = req.body;
  const [updated] = await db
    .update(clinicsTable)
    .set({
      ...(name !== undefined && { name }),
      ...(address !== undefined && { address }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
    })
    .where(eq(clinicsTable.id, clinicId))
    .returning();
  res.json(updated);
});

// GET /api/clinics/:clinicId/staff
router.get("/:clinicId/staff", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const clinicId = parseInt(req.params.clinicId);
  const staffList = await db.query.staffTable.findMany({ where: eq(staffTable.clinicId, clinicId) });
  const result = await Promise.all(
    staffList.map(async (s) => {
      const u = await db.query.usersTable.findFirst({ where: eq(usersTable.id, s.userId) });
      return {
        id: s.id,
        clinicId: s.clinicId,
        userId: s.userId,
        name: u?.name ?? null,
        email: u?.email ?? null,
        phone: u?.phone ?? null,
        role: s.role,
        status: s.status,
        createdAt: s.createdAt,
      };
    })
  );
  res.json(result);
});

// POST /api/clinics/:clinicId/staff
router.post("/:clinicId/staff", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(clerkId);
  const clinicId = parseInt(req.params.clinicId);
  const clinic = await db.query.clinicsTable.findFirst({ where: eq(clinicsTable.id, clinicId) });
  if (!clinic || clinic.ownerId !== user.id) return res.status(403).json({ error: "Forbidden" });
  const { email, phone, name } = req.body;
  // Find or create user by email or phone
  let targetUser = null;
  if (email) targetUser = await db.query.usersTable.findFirst({ where: eq(usersTable.email, email) });
  if (!targetUser && phone) targetUser = await db.query.usersTable.findFirst({ where: eq(usersTable.phone, phone) });
  if (!targetUser) {
    const [created] = await db.insert(usersTable).values({ clerkId: `invited_${Date.now()}`, name, email, phone, isVet: true, clinicId }).returning();
    targetUser = created;
  } else {
    await db.update(usersTable).set({ isVet: true, clinicId }).where(eq(usersTable.id, targetUser.id));
  }
  const [staff] = await db.insert(staffTable).values({ clinicId, userId: targetUser.id, role: "vet", status: "active" }).returning();
  res.status(201).json({
    id: staff.id, clinicId: staff.clinicId, userId: staff.userId,
    name: targetUser.name, email: targetUser.email, phone: targetUser.phone,
    role: staff.role, status: staff.status, createdAt: staff.createdAt,
  });
});

// DELETE /api/clinics/:clinicId/staff/:staffId
router.delete("/:clinicId/staff/:staffId", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(clerkId);
  const clinicId = parseInt(req.params.clinicId);
  const staffId = parseInt(req.params.staffId);
  const clinic = await db.query.clinicsTable.findFirst({ where: eq(clinicsTable.id, clinicId) });
  if (!clinic || clinic.ownerId !== user.id) return res.status(403).json({ error: "Forbidden" });
  await db.delete(staffTable).where(and(eq(staffTable.id, staffId), eq(staffTable.clinicId, clinicId)));
  res.status(204).send();
});

// GET /api/clinics/:clinicId/visits/active
router.get("/:clinicId/visits/active", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const clinicId = parseInt(req.params.clinicId);
  const { visitsTable, petsTable, usersTable: ut, speciesTable, dailyReportsTable } = await import("@workspace/db");
  const { desc } = await import("drizzle-orm");
  const visits = await db.query.visitsTable.findMany({
    where: and(eq(visitsTable.clinicId, clinicId), eq(visitsTable.status, "active")),
    orderBy: [desc(visitsTable.createdAt)],
  });
  const result = await Promise.all(visits.map(async (v) => {
    const pet = await db.query.petsTable.findFirst({ where: eq(petsTable.id, v.petId) });
    const owner = pet ? await db.query.usersTable.findFirst({ where: eq(ut.id, pet.ownerId) }) : null;
    const species = pet ? await db.query.speciesTable.findFirst({ where: eq(speciesTable.id, pet.speciesId) }) : null;
    const reports = await db.query.dailyReportsTable.findMany({ where: eq(dailyReportsTable.visitId, v.id), orderBy: [desc(dailyReportsTable.createdAt)] });
    const { visitItemsTable } = await import("@workspace/db");
    const items = await db.query.visitItemsTable.findMany({ where: eq(visitItemsTable.visitId, v.id) });
    const totalCost = items.reduce((sum, i) => sum + parseFloat(i.unitPrice) * parseFloat(i.quantity), 0)
      + reports.reduce((sum, r) => sum + parseFloat(r.cost), 0);
    return {
      id: v.id, petId: v.petId, petName: pet?.name ?? "Unknown", speciesName: species?.name ?? null,
      petStatus: pet?.status ?? "healthy", ownerName: owner?.name ?? null, ownerPhone: owner?.phone ?? null,
      clinicId: v.clinicId, type: v.type, status: v.status, visitDate: v.visitDate,
      totalCost, latestReport: reports[0]?.condition ?? null,
    };
  }));
  res.json(result);
});

// GET /api/clinics/:clinicId/reports/summary
router.get("/:clinicId/reports/summary", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const clinicId = parseInt(req.params.clinicId);
  const period = req.query.period as string || "monthly";
  const date = req.query.date as string || new Date().toISOString().split("T")[0];
  const { visitsTable, visitItemsTable, dailyReportsTable } = await import("@workspace/db");
  const { gte, lte, sql } = await import("drizzle-orm");

  let startDate: string, endDate: string;
  const d = new Date(date);
  if (period === "daily") {
    startDate = date; endDate = date;
  } else if (period === "monthly") {
    startDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    endDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${lastDay}`;
  } else {
    startDate = `${d.getFullYear()}-01-01`; endDate = `${d.getFullYear()}-12-31`;
  }

  const visits = await db.query.visitsTable.findMany({
    where: and(eq(visitsTable.clinicId, clinicId), gte(visitsTable.visitDate, startDate), lte(visitsTable.visitDate, endDate)),
  });

  let totalRevenue = 0;
  const serviceMap: Record<string, { count: number; revenue: number }> = {};
  for (const v of visits) {
    const items = await db.query.visitItemsTable.findMany({ where: eq(visitItemsTable.visitId, v.id) });
    const reports = await db.query.dailyReportsTable.findMany({ where: eq(dailyReportsTable.visitId, v.id) });
    for (const i of items) {
      const amt = parseFloat(i.unitPrice) * parseFloat(i.quantity);
      totalRevenue += amt;
      if (!serviceMap[i.name]) serviceMap[i.name] = { count: 0, revenue: 0 };
      serviceMap[i.name].count++;
      serviceMap[i.name].revenue += amt;
    }
    for (const r of reports) {
      totalRevenue += parseFloat(r.cost);
    }
  }

  const topServices = Object.entries(serviceMap)
    .map(([name, v]) => ({ name, count: v.count, revenue: v.revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  res.json({
    period, date,
    totalRevenue,
    totalVisits: visits.length,
    inpatientVisits: visits.filter(v => v.type === "inpatient").length,
    outpatientVisits: visits.filter(v => v.type === "outpatient").length,
    averageRevenuePerVisit: visits.length > 0 ? totalRevenue / visits.length : 0,
    topServices,
    topProducts: [],
  });
});

// GET /api/clinics/:clinicId/reports/visits
router.get("/:clinicId/reports/visits", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const clinicId = parseInt(req.params.clinicId);
  const period = req.query.period as string || "monthly";
  const date = req.query.date as string || new Date().toISOString().split("T")[0];
  const { visitsTable } = await import("@workspace/db");
  const { gte, lte } = await import("drizzle-orm");

  const d = new Date(date);
  let labels: string[] = [];
  let visitCounts: number[] = [];
  let revenues: number[] = [];

  if (period === "daily") {
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const day = new Date(d); day.setDate(d.getDate() - i);
      const dayStr = day.toISOString().split("T")[0];
      labels.push(dayStr);
      const visits = await db.query.visitsTable.findMany({ where: and(eq(visitsTable.clinicId, clinicId), eq(visitsTable.visitDate, dayStr)) });
      visitCounts.push(visits.length);
      revenues.push(0);
    }
  } else if (period === "monthly") {
    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const monthStr = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
      labels.push(monthStr);
      const start = `${monthStr}-01`;
      const lastDay = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
      const end = `${monthStr}-${lastDay}`;
      const visits = await db.query.visitsTable.findMany({ where: and(eq(visitsTable.clinicId, clinicId), gte(visitsTable.visitDate, start), lte(visitsTable.visitDate, end)) });
      visitCounts.push(visits.length);
      revenues.push(0);
    }
  } else {
    // Last 5 years
    for (let i = 4; i >= 0; i--) {
      const year = d.getFullYear() - i;
      labels.push(String(year));
      const visits = await db.query.visitsTable.findMany({ where: and(eq(visitsTable.clinicId, clinicId), gte(visitsTable.visitDate, `${year}-01-01`), lte(visitsTable.visitDate, `${year}-12-31`)) });
      visitCounts.push(visits.length);
      revenues.push(0);
    }
  }

  res.json({ period, labels, visitCounts, revenues });
});

// GET /api/clinics/:clinicId/products
router.get("/:clinicId/products", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const clinicId = parseInt(req.params.clinicId);
  const { productsTable } = await import("@workspace/db");
  const products = await db.query.productsTable.findMany({ where: eq(productsTable.clinicId, clinicId) });
  res.json(products.map(p => ({ ...p, price: parseFloat(p.price) })));
});

// POST /api/clinics/:clinicId/products
router.post("/:clinicId/products", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const clinicId = parseInt(req.params.clinicId);
  const { productsTable } = await import("@workspace/db");
  const { name, category, description, price, stock, unit } = req.body;
  const [product] = await db.insert(productsTable).values({
    clinicId, name, category, description,
    price: String(price ?? 0), stock, unit,
  }).returning();
  res.status(201).json({ ...product, price: parseFloat(product.price) });
});

export default router;
