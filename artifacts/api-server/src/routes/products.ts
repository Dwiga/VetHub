import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getStackUserId } from "../lib/auth";

const router = Router();

// PATCH /api/products/:productId
router.patch("/:productId", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  const productId = parseInt(req.params.productId);
  const { name, category, description, price, stock, unit, isActive } = req.body;
  const [updated] = await db.update(productsTable).set({
    ...(name !== undefined && { name }),
    ...(category !== undefined && { category }),
    ...(description !== undefined && { description }),
    ...(price !== undefined && { price: String(price) }),
    ...(stock !== undefined && { stock }),
    ...(unit !== undefined && { unit }),
    ...(isActive !== undefined && { isActive }),
  }).where(eq(productsTable.id, productId)).returning();
  if (!updated) return res.status(404).json({ error: "Product not found" });
  res.json({ ...updated, price: parseFloat(updated.price) });
});

// DELETE /api/products/:productId
router.delete("/:productId", async (req, res) => {
  const stackId = await getStackUserId(req);
  if (!stackId) return res.status(401).json({ error: "Unauthorized" });
  await db.delete(productsTable).where(eq(productsTable.id, parseInt(req.params.productId)));
  res.status(204).send();
});

export default router;
