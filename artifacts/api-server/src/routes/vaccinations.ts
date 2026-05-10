import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { vaccinationsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getOrCreateUser } from "./users";

const router = Router();

// DELETE /api/vaccinations/:vaccinationId
router.delete("/:vaccinationId", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  await db.delete(vaccinationsTable).where(eq(vaccinationsTable.id, parseInt(req.params.vaccinationId)));
  res.status(204).send();
});

export default router;
