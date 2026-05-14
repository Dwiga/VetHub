import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, clinicsTable, staffTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { getOrCreateUser } from "./users";
import { getStackUserId } from "../lib/auth";

const router = Router();

// GET /api/clinics/mine
router.get("/mine", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(stackId);
  if (!user.clinicId) return res.status(404).json({ error: "No clinic found" });
  const clinic = await db.query.clinicsTable.findFirst({ where: eq(clinicsTable.id, user.clinicId) });
  if (!clinic) return res.status(404).json({ error: "Clinic not found" });
  res.json(clinic);
});

// PATCH /api/clinics/:clinicId
router.patch("/:clinicId", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(stackId);
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
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const clinicId = parseInt(req.params.clinicId);
  const staffList = await db.query.staffTable.findMany({ where: eq(staffTable.clinicId, clinicId) });
  const result = await Promise.all(
    staffList.map(async (s) => {
      const u = await db.query.usersTable.findFirst({ where: eq(usersTable.id, s.userId) });
      return {
        id: s.id, clinicId: s.clinicId, userId: s.userId,
        name: u?.name ?? null, email: u?.email ?? null, phone: u?.phone ?? null,
        role: s.role, status: s.status, createdAt: s.createdAt,
      };
    })
  );
  res.json(result);
});

// POST /api/clinics/:clinicId/staff
router.post("/:clinicId/staff", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(stackId);
  const clinicId = parseInt(req.params.clinicId);
  const clinic = await db.query.clinicsTable.findFirst({ where: eq(clinicsTable.id, clinicId) });
  if (!clinic || clinic.ownerId !== user.id) return res.status(403).json({ error: "Forbidden" });
  const { email, phone, name } = req.body;
  let targetUser = null;
  if (email) targetUser = await db.query.usersTable.findFirst({ where: eq(usersTable.email, email) });
  if (!targetUser && phone) targetUser = await db.query.usersTable.findFirst({ where: eq(usersTable.phone, phone) });
  if (!targetUser) {
    // Create a placeholder user for invited staff (no Stack Auth account yet)
    const [created] = await db.insert(usersTable).values({
      stackId: `invited_${Date.now()}`,
      name, email, phone, isVet: true, clinicId,
    }).returning();
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
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(stackId);
  const clinicId = parseInt(req.params.clinicId);
  const staffId = parseInt(req.params.staffId);
  const clinic = await db.query.clinicsTable.findFirst({ where: eq(clinicsTable.id, clinicId) });
  if (!clinic || clinic.ownerId !== user.id) return res.status(403).json({ error: "Forbidden" });
  await db.delete(staffTable).where(and(eq(staffTable.id, staffId), eq(staffTable.clinicId, clinicId)));
  res.status(204).send();
});

// GET /api/clinics/:clinicId/visits/active
router.get("/:clinicId/visits/active", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
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

// Helper: get start/end dates for a period
function getPeriodRange(period: string, date: string): { startDate: string; endDate: string } {
  const d = new Date(date);
  if (period === "daily") {
    return { startDate: date, endDate: date };
  } else if (period === "weekly") {
    const day = d.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const mon = new Date(d); mon.setDate(d.getDate() + diffToMon);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { startDate: mon.toISOString().split("T")[0], endDate: sun.toISOString().split("T")[0] };
  } else if (period === "monthly") {
    const y = d.getFullYear(), m = d.getMonth() + 1;
    const lastDay = new Date(y, m, 0).getDate();
    return { startDate: `${y}-${String(m).padStart(2, "0")}-01`, endDate: `${y}-${String(m).padStart(2, "0")}-${lastDay}` };
  } else if (period === "quarterly") {
    const q = Math.floor(d.getMonth() / 3);
    const startMonth = q * 3 + 1;
    const endMonth = startMonth + 2;
    const lastDay = new Date(d.getFullYear(), endMonth, 0).getDate();
    return {
      startDate: `${d.getFullYear()}-${String(startMonth).padStart(2, "0")}-01`,
      endDate: `${d.getFullYear()}-${String(endMonth).padStart(2, "0")}-${lastDay}`,
    };
  } else {
    return { startDate: `${d.getFullYear()}-01-01`, endDate: `${d.getFullYear()}-12-31` };
  }
}

// GET /api/clinics/:clinicId/reports/summary
router.get("/:clinicId/reports/summary", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const clinicId = parseInt(req.params.clinicId);
  const period = (req.query.period as string) || "monthly";
  const date = (req.query.date as string) || new Date().toISOString().split("T")[0];
  const { visitsTable, visitItemsTable, dailyReportsTable, petsTable } = await import("@workspace/db");

  const { startDate, endDate } = getPeriodRange(period, date);
  const visits = await db.query.visitsTable.findMany({
    where: and(eq(visitsTable.clinicId, clinicId), gte(visitsTable.visitDate, startDate), lte(visitsTable.visitDate, endDate)),
  });

  let totalRevenue = 0;
  let diedCount = 0;
  let survivedCount = 0;
  let earlyDischargeCount = 0;
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
    for (const r of reports) totalRevenue += parseFloat(r.cost);
    if (v.status === "cancelled") {
      earlyDischargeCount++;
    } else if (v.status === "completed" && v.type === "inpatient") {
      const pet = await db.query.petsTable.findFirst({ where: eq(petsTable.id, v.petId) });
      if (pet?.status === "passed_away") diedCount++;
      else survivedCount++;
    }
  }

  const topServices = Object.entries(serviceMap)
    .map(([name, val]) => ({ name, count: val.count, revenue: val.revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  res.json({
    period, date, totalRevenue,
    totalVisits: visits.length,
    inpatientVisits: visits.filter(v => v.type === "inpatient").length,
    outpatientVisits: visits.filter(v => v.type === "outpatient").length,
    averageRevenuePerVisit: visits.length > 0 ? totalRevenue / visits.length : 0,
    diedCount, survivedCount, earlyDischargeCount, topServices, topProducts: [],
  });
});

// GET /api/clinics/:clinicId/reports/visits
router.get("/:clinicId/reports/visits", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const clinicId = parseInt(req.params.clinicId);
  const period = (req.query.period as string) || "monthly";
  const date = (req.query.date as string) || new Date().toISOString().split("T")[0];
  const { visitsTable, visitItemsTable, dailyReportsTable } = await import("@workspace/db");

  const d = new Date(date);
  const labels: string[] = [];
  const visitCounts: number[] = [];
  const revenues: number[] = [];

  async function bucketRevenue(start: string, end: string): Promise<{ count: number; revenue: number }> {
    const vs = await db.query.visitsTable.findMany({
      where: and(eq(visitsTable.clinicId, clinicId), gte(visitsTable.visitDate, start), lte(visitsTable.visitDate, end)),
    });
    let rev = 0;
    for (const v of vs) {
      const items = await db.query.visitItemsTable.findMany({ where: eq(visitItemsTable.visitId, v.id) });
      const rpts = await db.query.dailyReportsTable.findMany({ where: eq(dailyReportsTable.visitId, v.id) });
      rev += items.reduce((s: number, i: any) => s + parseFloat(i.unitPrice) * parseFloat(i.quantity), 0)
        + rpts.reduce((s: number, r: any) => s + parseFloat(r.cost), 0);
    }
    return { count: vs.length, revenue: rev };
  }

  if (period === "daily" || period === "weekly") {
    for (let i = 6; i >= 0; i--) {
      const day = new Date(d); day.setDate(d.getDate() - i);
      const dayStr = day.toISOString().split("T")[0];
      labels.push(dayStr.slice(5));
      const { count, revenue } = await bucketRevenue(dayStr, dayStr);
      visitCounts.push(count); revenues.push(revenue);
    }
  } else if (period === "monthly") {
    for (let i = 11; i >= 0; i--) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const y = m.getFullYear(), mo = m.getMonth() + 1;
      const monthStr = `${y}-${String(mo).padStart(2, "0")}`;
      labels.push(monthStr);
      const start = `${monthStr}-01`;
      const end = `${monthStr}-${new Date(y, mo, 0).getDate()}`;
      const { count, revenue } = await bucketRevenue(start, end);
      visitCounts.push(count); revenues.push(revenue);
    }
  } else if (period === "quarterly") {
    for (let i = 7; i >= 0; i--) {
      const totalMonths = d.getFullYear() * 12 + d.getMonth() - i * 3;
      const qYear = Math.floor(totalMonths / 12);
      const qMonth = totalMonths % 12;
      const qNum = Math.floor(qMonth / 3) + 1;
      const startMonth = (qNum - 1) * 3 + 1;
      const endMonth = startMonth + 2;
      labels.push(`Q${qNum} ${qYear}`);
      const start = `${qYear}-${String(startMonth).padStart(2, "0")}-01`;
      const end = `${qYear}-${String(endMonth).padStart(2, "0")}-${new Date(qYear, endMonth, 0).getDate()}`;
      const { count, revenue } = await bucketRevenue(start, end);
      visitCounts.push(count); revenues.push(revenue);
    }
  } else {
    for (let i = 4; i >= 0; i--) {
      const year = d.getFullYear() - i;
      labels.push(String(year));
      const { count, revenue } = await bucketRevenue(`${year}-01-01`, `${year}-12-31`);
      visitCounts.push(count); revenues.push(revenue);
    }
  }

  res.json({ period, labels, visitCounts, revenues });
});

// GET /api/clinics/:clinicId/products
router.get("/:clinicId/products", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const clinicId = parseInt(req.params.clinicId);
  const { productsTable } = await import("@workspace/db");
  const products = await db.query.productsTable.findMany({ where: eq(productsTable.clinicId, clinicId) });
  res.json(products.map(p => ({ ...p, price: parseFloat(p.price) })));
});

// POST /api/clinics/:clinicId/products
router.post("/:clinicId/products", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
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
