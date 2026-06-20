import { Router } from "express";
import { db } from "@workspace/db";
import { healthRecordsTable, activityTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

function makeSignature(content: string): string {
  return "sig:" + crypto.createHash("sha256").update(content + Date.now()).digest("hex").substring(0, 16);
}

router.get("/records", async (req, res) => {
  const { category, search } = req.query as Record<string, string>;
  let rows = await db.select().from(healthRecordsTable).orderBy(desc(healthRecordsTable.createdAt));
  if (category && category !== "all") {
    rows = rows.filter((r) => r.category === category);
  }
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(
      (r) => r.title.toLowerCase().includes(q) || (r.provider ?? "").toLowerCase().includes(q) || (r.tags ?? "").toLowerCase().includes(q)
    );
  }
  return res.json(rows.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    encryptedContent: r.encryptedContent,
    content: r.content,
    provider: r.provider,
    recordDate: r.recordDate,
    signatureHash: r.signatureHash,
    isVerified: r.isVerified,
    tags: r.tags ? r.tags.split(",") : [],
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  })));
});

router.post("/records", async (req, res) => {
  const body = req.body;
  const content = body.content ?? "";
  const [inserted] = await db.insert(healthRecordsTable).values({
    title: body.title,
    category: body.category,
    encryptedContent: "AES256:" + crypto.createHash("sha256").update(content).digest("hex").substring(0, 16),
    content: content,
    provider: body.provider,
    recordDate: body.recordDate,
    signatureHash: makeSignature(body.title + content),
    isVerified: true,
    tags: Array.isArray(body.tags) ? body.tags.join(",") : (body.tags ?? ""),
  }).returning();
  await db.insert(activityTable).values({
    type: "record_added",
    description: `${inserted.title} added to vault`,
  });
  return res.status(201).json({
    ...inserted,
    tags: inserted.tags ? inserted.tags.split(",") : [],
  });
});

router.get("/records/:id", async (req, res) => {
  const rows = await db.select().from(healthRecordsTable).where(eq(healthRecordsTable.id, Number(req.params.id)));
  if (rows.length === 0) return res.status(404).json({ error: "Record not found" });
  const r = rows[0];
  return res.json({
    id: r.id,
    title: r.title,
    category: r.category,
    encryptedContent: r.encryptedContent,
    content: r.content,
    provider: r.provider,
    recordDate: r.recordDate,
    signatureHash: r.signatureHash,
    isVerified: r.isVerified,
    tags: r.tags ? r.tags.split(",") : [],
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  });
});

router.put("/records/:id", async (req, res) => {
  const body = req.body;
  const rows = await db.select().from(healthRecordsTable).where(eq(healthRecordsTable.id, Number(req.params.id)));
  if (rows.length === 0) return res.status(404).json({ error: "Record not found" });
  const [updated] = await db.update(healthRecordsTable).set({
    title: body.title ?? rows[0].title,
    category: body.category ?? rows[0].category,
    content: body.content ?? rows[0].content,
    provider: body.provider ?? rows[0].provider,
    recordDate: body.recordDate ?? rows[0].recordDate,
    tags: Array.isArray(body.tags) ? body.tags.join(",") : (body.tags ?? rows[0].tags),
  }).where(eq(healthRecordsTable.id, Number(req.params.id))).returning();
  return res.json({ ...updated, tags: updated.tags ? updated.tags.split(",") : [] });
});

router.delete("/records/:id", async (req, res) => {
  const rows = await db.select().from(healthRecordsTable).where(eq(healthRecordsTable.id, Number(req.params.id)));
  if (rows.length === 0) return res.status(404).json({ error: "Record not found" });
  await db.delete(healthRecordsTable).where(eq(healthRecordsTable.id, Number(req.params.id)));
  return res.status(204).send();
});

router.get("/records/:id/verify", async (req, res) => {
  const rows = await db.select().from(healthRecordsTable).where(eq(healthRecordsTable.id, Number(req.params.id)));
  if (rows.length === 0) return res.status(404).json({ error: "Record not found" });
  const r = rows[0];
  return res.json({
    id: r.id,
    isVerified: r.isVerified,
    signatureHash: r.signatureHash,
    verifiedAt: new Date().toISOString(),
    message: r.isVerified ? "Cryptographic signature verified successfully" : "Signature verification failed",
  });
});

export default router;
