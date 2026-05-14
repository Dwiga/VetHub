import { Router } from "express";
import { db } from "@workspace/db";
import { vaccinationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getStackUserId } from "../lib/auth";

const router = Router();

// DELETE /api/vaccinations/:vaccinationId
router.delete("/:vaccinationId", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  await db.delete(vaccinationsTable).where(eq(vaccinationsTable.id, parseInt(req.params.vaccinationId)));
  res.status(204).send();
});

export default router;
