import { Router } from "express";
import { db } from "@workspace/db";
import { alertsTable, activityTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

function toDto(r: typeof alertsTable.$inferSelect) {
  return {
    id: r.id,
    type: r.type,
    severity: r.severity,
    title: r.title,
    description: r.description,
    relatedIds: r.relatedIds ? r.relatedIds.split(",") : [],
    isDismissed: r.isDismissed,
    createdAt: r.createdAt,
    dismissedAt: r.dismissedAt,
  };
}

router.get("/alerts", async (req, res) => {
  const { type, severity, dismissed } = req.query as Record<string, string>;
  let rows = await db.select().from(alertsTable).orderBy(desc(alertsTable.createdAt));
  if (type && type !== "all") rows = rows.filter((r) => r.type === type);
  if (severity && severity !== "all") rows = rows.filter((r) => r.severity === severity);
  if (dismissed === "false") rows = rows.filter((r) => !r.isDismissed);
  return res.json(rows.map(toDto));
});

router.post("/alerts/:id/dismiss", async (req, res) => {
  const rows = await db.select().from(alertsTable).where(eq(alertsTable.id, Number(req.params.id)));
  if (rows.length === 0) return res.status(404).json({ error: "Alert not found" });
  const [updated] = await db.update(alertsTable).set({
    isDismissed: true,
    dismissedAt: new Date(),
  }).where(eq(alertsTable.id, Number(req.params.id))).returning();
  return res.json(toDto(updated));
});

export default router;
