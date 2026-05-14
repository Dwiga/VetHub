import { Router } from "express";
import { db } from "@workspace/db";
import { visitItemsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getStackUserId } from "../lib/auth";

const router = Router();

// PATCH /api/visit-items/:itemId
router.patch("/:itemId", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const itemId = parseInt(req.params.itemId);
  const { name, description, quantity, unitPrice, isPaid } = req.body;
  const [updated] = await db.update(visitItemsTable).set({
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
    ...(quantity !== undefined && { quantity: String(quantity) }),
    ...(unitPrice !== undefined && { unitPrice: String(unitPrice) }),
    ...(isPaid !== undefined && { isPaid }),
  }).where(eq(visitItemsTable.id, itemId)).returning();
  if (!updated) return res.status(404).json({ error: "Item not found" });
  res.json({
    ...updated,
    quantity: parseFloat(updated.quantity),
    unitPrice: parseFloat(updated.unitPrice),
    totalPrice: parseFloat(updated.unitPrice) * parseFloat(updated.quantity),
    isPaid: updated.isPaid,
  });
});

// DELETE /api/visit-items/:itemId
router.delete("/:itemId", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  await db.delete(visitItemsTable).where(eq(visitItemsTable.id, parseInt(req.params.itemId)));
  res.status(204).send();
});

export default router;
