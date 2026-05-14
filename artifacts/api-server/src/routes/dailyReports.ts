import { Router } from "express";
import { db } from "@workspace/db";
import { dailyReportsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getStackUserId } from "../lib/auth";

const router = Router();

// GET /api/daily-reports/:reportId
router.get("/:reportId", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const report = await db.query.dailyReportsTable.findFirst({ where: eq(dailyReportsTable.id, parseInt(req.params.reportId)) });
  if (!report) return res.status(404).json({ error: "Report not found" });
  res.json({ ...report, cost: parseFloat(report.cost), vetName: null });
});

// PATCH /api/daily-reports/:reportId
router.patch("/:reportId", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const { condition, treatment, notes, cost } = req.body;
  const [updated] = await db.update(dailyReportsTable).set({
    ...(condition !== undefined && { condition }),
    ...(treatment !== undefined && { treatment }),
    ...(notes !== undefined && { notes }),
    ...(cost !== undefined && { cost: String(cost) }),
  }).where(eq(dailyReportsTable.id, parseInt(req.params.reportId))).returning();
  if (!updated) return res.status(404).json({ error: "Report not found" });
  res.json({ ...updated, cost: parseFloat(updated.cost), vetName: null });
});

export default router;
