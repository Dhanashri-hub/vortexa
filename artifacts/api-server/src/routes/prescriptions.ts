import { Router } from "express";
import { db } from "@workspace/db";
import { prescriptionsTable, activityTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

function makeSignature(content: string): string {
  return "sig:" + crypto.createHash("sha256").update(content + Date.now()).digest("hex").substring(0, 16);
}

function toDto(r: typeof prescriptionsTable.$inferSelect) {
  return {
    id: r.id,
    medicationName: r.medicationName,
    dosage: r.dosage,
    frequency: r.frequency,
    prescribedBy: r.prescribedBy,
    prescribedAt: r.prescribedAt,
    expiresAt: r.expiresAt,
    refillsRemaining: r.refillsRemaining,
    instructions: r.instructions,
    pharmacyName: r.pharmacyName,
    npiNumber: r.npiNumber,
    status: r.status,
    signatureHash: r.signatureHash,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

router.get("/prescriptions", async (req, res) => {
  const { status } = req.query as Record<string, string>;
  let rows = await db.select().from(prescriptionsTable).orderBy(desc(prescriptionsTable.createdAt));
  if (status && status !== "all") {
    rows = rows.filter((r) => r.status === status);
  }
  return res.json(rows.map(toDto));
});

router.post("/prescriptions", async (req, res) => {
  const body = req.body;
  const [inserted] = await db.insert(prescriptionsTable).values({
    medicationName: body.medicationName,
    dosage: body.dosage,
    frequency: body.frequency,
    prescribedBy: body.prescribedBy,
    prescribedAt: body.prescribedAt ?? new Date().toISOString().split("T")[0],
    expiresAt: body.expiresAt,
    refillsRemaining: body.refillsRemaining,
    instructions: body.instructions,
    pharmacyName: body.pharmacyName,
    npiNumber: body.npiNumber,
    status: body.status ?? "active",
    signatureHash: makeSignature(body.medicationName + body.prescribedBy),
  }).returning();
  await db.insert(activityTable).values({
    type: "prescription_added",
    description: `${inserted.medicationName} prescription recorded`,
  });
  return res.status(201).json(toDto(inserted));
});

router.get("/prescriptions/:id", async (req, res) => {
  const rows = await db.select().from(prescriptionsTable).where(eq(prescriptionsTable.id, Number(req.params.id)));
  if (rows.length === 0) return res.status(404).json({ error: "Prescription not found" });
  return res.json(toDto(rows[0]));
});

router.put("/prescriptions/:id", async (req, res) => {
  const body = req.body;
  const rows = await db.select().from(prescriptionsTable).where(eq(prescriptionsTable.id, Number(req.params.id)));
  if (rows.length === 0) return res.status(404).json({ error: "Prescription not found" });
  const [updated] = await db.update(prescriptionsTable).set({
    medicationName: body.medicationName ?? rows[0].medicationName,
    dosage: body.dosage ?? rows[0].dosage,
    frequency: body.frequency ?? rows[0].frequency,
    prescribedBy: body.prescribedBy ?? rows[0].prescribedBy,
    expiresAt: body.expiresAt ?? rows[0].expiresAt,
    refillsRemaining: body.refillsRemaining ?? rows[0].refillsRemaining,
    instructions: body.instructions ?? rows[0].instructions,
    pharmacyName: body.pharmacyName ?? rows[0].pharmacyName,
    npiNumber: body.npiNumber ?? rows[0].npiNumber,
    status: body.status ?? rows[0].status,
  }).where(eq(prescriptionsTable.id, Number(req.params.id))).returning();
  return res.json(toDto(updated));
});

router.delete("/prescriptions/:id", async (req, res) => {
  const rows = await db.select().from(prescriptionsTable).where(eq(prescriptionsTable.id, Number(req.params.id)));
  if (rows.length === 0) return res.status(404).json({ error: "Prescription not found" });
  await db.delete(prescriptionsTable).where(eq(prescriptionsTable.id, Number(req.params.id)));
  return res.status(204).send();
});

export default router;
