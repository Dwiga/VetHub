import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, petsTable, visitsTable, visitItemsTable, dailyReportsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { getOrCreateUser } from "./users";

const router = Router();

async function buildVisitDetail(visitId: number) {
  const visit = await db.query.visitsTable.findFirst({ where: eq(visitsTable.id, visitId) });
  if (!visit) return null;
  const pet = await db.query.petsTable.findFirst({ where: eq(petsTable.id, visit.petId) });
  const items = await db.query.visitItemsTable.findMany({ where: eq(visitItemsTable.visitId, visitId), orderBy: [desc(visitItemsTable.itemDate), desc(visitItemsTable.createdAt)] });
  const reports = await db.query.dailyReportsTable.findMany({ where: eq(dailyReportsTable.visitId, visitId), orderBy: [desc(dailyReportsTable.reportDate)] });
  const totalCost = items.reduce((s, i) => s + parseFloat(i.unitPrice) * parseFloat(i.quantity), 0)
    + reports.reduce((s, r) => s + parseFloat(r.cost), 0);
  let vetName = null;
  if (visit.vetId) {
    const vet = await db.query.usersTable.findFirst({ where: eq(usersTable.id, visit.vetId) });
    vetName = vet?.name ?? null;
  }
  const formattedItems = items.map(i => ({
    ...i,
    quantity: parseFloat(i.quantity),
    unitPrice: parseFloat(i.unitPrice),
    totalPrice: parseFloat(i.unitPrice) * parseFloat(i.quantity),
  }));
  const formattedReports = reports.map(r => {
    return { ...r, cost: parseFloat(r.cost), vetName: null };
  });
  return { ...visit, petName: pet?.name ?? null, vetName, totalCost, items: formattedItems, dailyReports: formattedReports };
}

// GET /api/visits/:visitId
router.get("/:visitId", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const detail = await buildVisitDetail(parseInt(req.params.visitId));
  if (!detail) return res.status(404).json({ error: "Visit not found" });
  res.json(detail);
});

// PATCH /api/visits/:visitId
router.patch("/:visitId", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const visitId = parseInt(req.params.visitId);
  const { anamnesis, therapy, status, dischargeDate, vetId } = req.body;
  const [updated] = await db.update(visitsTable).set({
    ...(anamnesis !== undefined && { anamnesis }),
    ...(therapy !== undefined && { therapy }),
    ...(status !== undefined && { status }),
    ...(dischargeDate !== undefined && { dischargeDate }),
    ...(vetId !== undefined && { vetId }),
  }).where(eq(visitsTable.id, visitId)).returning();
  if (!updated) return res.status(404).json({ error: "Visit not found" });
  // Update pet status when visit completed
  if (status === "completed") {
    await db.update(petsTable).set({ status: "healthy" }).where(eq(petsTable.id, updated.petId));
  }
  const detail = await buildVisitDetail(visitId);
  res.json(detail);
});

// POST /api/visits/:visitId/items
router.post("/:visitId/items", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const visitId = parseInt(req.params.visitId);
  const { category, name, description, quantity, unitPrice, itemDate } = req.body;
  if (!category || !name || !quantity || unitPrice === undefined) {
    return res.status(400).json({ error: "category, name, quantity, unitPrice are required" });
  }
  const today = new Date().toISOString().split("T")[0];
  const [item] = await db.insert(visitItemsTable).values({
    visitId, category, name, description,
    quantity: String(quantity), unitPrice: String(unitPrice),
    itemDate: itemDate ?? today,
  }).returning();
  res.status(201).json({
    ...item,
    quantity: parseFloat(item.quantity),
    unitPrice: parseFloat(item.unitPrice),
    totalPrice: parseFloat(item.unitPrice) * parseFloat(item.quantity),
  });
});

// GET /api/visits/:visitId/daily-reports
router.get("/:visitId/daily-reports", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const visitId = parseInt(req.params.visitId);
  const reports = await db.query.dailyReportsTable.findMany({
    where: eq(dailyReportsTable.visitId, visitId),
    orderBy: [desc(dailyReportsTable.reportDate)],
  });
  res.json(reports.map(r => ({ ...r, cost: parseFloat(r.cost), vetName: null })));
});

// POST /api/visits/:visitId/daily-reports
router.post("/:visitId/daily-reports", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getOrCreateUser(clerkId);
  const visitId = parseInt(req.params.visitId);
  const { reportDate, condition, treatment, notes, cost } = req.body;
  if (!reportDate) return res.status(400).json({ error: "reportDate is required" });
  const [report] = await db.insert(dailyReportsTable).values({
    visitId, reportDate, condition, treatment, notes,
    cost: String(cost ?? 0), vetId: user.id,
  }).returning();
  res.status(201).json({ ...report, cost: parseFloat(report.cost), vetName: user.name });
});

export default router;
