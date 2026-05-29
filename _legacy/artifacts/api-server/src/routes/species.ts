import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { speciesTable } from "@workspace/db";

const router = Router();

// GET /api/species
router.get("/", async (req, res) => {
  const species = await db.query.speciesTable.findMany();
  res.json(species);
});

// POST /api/species
router.post("/", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const { name, icon } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  const [species] = await db.insert(speciesTable).values({ name, icon }).returning();
  res.status(201).json(species);
});

export default router;
