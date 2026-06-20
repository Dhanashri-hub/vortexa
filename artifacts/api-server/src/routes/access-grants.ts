import { Router } from "express";
import { db } from "@workspace/db";
import { accessGrantsTable, auditEntriesTable, activityTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

function toDto(r: typeof accessGrantsTable.$inferSelect) {
  return {
    id: r.id,
    providerName: r.providerName,
    providerType: r.providerType,
    providerEmail: r.providerEmail,
    grantedAt: r.grantedAt,
    expiresAt: r.expiresAt,
    recordScope: r.recordScope,
    signatureHash: r.signatureHash,
    isActive: r.isActive,
    lastAccessedAt: r.lastAccessedAt,
    accessCount: r.accessCount,
  };
}

router.get("/access-grants", async (req, res) => {
  const rows = await db.select().from(accessGrantsTable).where(eq(accessGrantsTable.isActive, true)).orderBy(desc(accessGrantsTable.grantedAt));
  return res.json(rows.map(toDto));
});

router.post("/access-grants", async (req, res) => {
  const body = req.body;
  const sigHash = "sig:" + crypto.createHash("sha256").update(body.providerName + body.providerEmail + Date.now()).digest("hex").substring(0, 16);
  const [inserted] = await db.insert(accessGrantsTable).values({
    providerName: body.providerName,
    providerType: body.providerType,
    providerEmail: body.providerEmail,
    expiresAt: body.expiresAt,
    recordScope: body.recordScope,
    signatureHash: sigHash,
    isActive: true,
    accessCount: 0,
  }).returning();
  await db.insert(activityTable).values({
    type: "grant_created",
    description: `Access granted to ${inserted.providerName}`,
  });
  return res.status(201).json(toDto(inserted));
});

router.delete("/access-grants/:id", async (req, res) => {
  const rows = await db.select().from(accessGrantsTable).where(eq(accessGrantsTable.id, Number(req.params.id)));
  if (rows.length === 0) return res.status(404).json({ error: "Access grant not found" });
  const [updated] = await db.update(accessGrantsTable).set({ isActive: false }).where(eq(accessGrantsTable.id, Number(req.params.id))).returning();
  await db.insert(activityTable).values({
    type: "grant_revoked",
    description: `Access revoked for ${rows[0].providerName}`,
  });
  return res.json(toDto(updated));
});

router.get("/access-grants/:id/audit", async (req, res) => {
  const entries = await db.select().from(auditEntriesTable)
    .where(eq(auditEntriesTable.grantId, Number(req.params.id)))
    .orderBy(desc(auditEntriesTable.timestamp));
  return res.json(entries.map((e) => ({
    id: e.id,
    grantId: e.grantId,
    action: e.action,
    ipAddress: e.ipAddress,
    userAgent: e.userAgent,
    timestamp: e.timestamp,
  })));
});

export default router;
