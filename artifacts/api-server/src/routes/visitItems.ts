import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { visitItemsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// PATCH /api/visit-items/:itemId
router.patch("/:itemId", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  const itemId = parseInt(req.params.itemId);
  const { name, description, quantity, unitPrice } = req.body;
  const [updated] = await db.update(visitItemsTable).set({
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
    ...(quantity !== undefined && { quantity: String(quantity) }),
    ...(unitPrice !== undefined && { unitPrice: String(unitPrice) }),
  }).where(eq(visitItemsTable.id, itemId)).returning();
  if (!updated) return res.status(404).json({ error: "Item not found" });
  res.json({
    ...updated,
    quantity: parseFloat(updated.quantity),
    unitPrice: parseFloat(updated.unitPrice),
    totalPrice: parseFloat(updated.unitPrice) * parseFloat(updated.quantity),
  });
});

// DELETE /api/visit-items/:itemId
router.delete("/:itemId", async (req, res) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) return res.status(401).json({ error: "Unauthorized" });
  await db.delete(visitItemsTable).where(eq(visitItemsTable.id, parseInt(req.params.itemId)));
  res.status(204).send();
});

export default router;
