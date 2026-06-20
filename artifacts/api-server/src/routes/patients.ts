import { Router } from "express";
import { db } from "@workspace/db";
import { patientsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/patient", async (req, res) => {
  const rows = await db.select().from(patientsTable).limit(1);
  if (rows.length === 0) {
    return res.status(404).json({ error: "Patient not found" });
  }
  const p = rows[0];
  return res.json({
    id: p.id,
    name: p.name,
    email: p.email,
    dateOfBirth: p.dateOfBirth,
    bloodType: p.bloodType,
    allergies: p.allergies,
    emergencyContact: p.emergencyContact,
    encryptionKeyFingerprint: p.encryptionKeyFingerprint,
    publicKey: p.publicKey,
    createdAt: p.createdAt,
  });
});

router.patch("/patient", async (req, res) => {
  const rows = await db.select().from(patientsTable).limit(1);
  const body = req.body;
  if (rows.length === 0) {
    const [inserted] = await db.insert(patientsTable).values({
      name: body.name,
      email: body.email,
      dateOfBirth: body.dateOfBirth,
      bloodType: body.bloodType,
      allergies: body.allergies,
      emergencyContact: body.emergencyContact,
      encryptionKeyFingerprint: body.encryptionKeyFingerprint ?? "sha256:default",
      publicKey: body.publicKey,
    }).returning();
    return res.json(inserted);
  }
  const [updated] = await db.update(patientsTable)
    .set({
      name: body.name ?? rows[0].name,
      email: body.email ?? rows[0].email,
      dateOfBirth: body.dateOfBirth ?? rows[0].dateOfBirth,
      bloodType: body.bloodType ?? rows[0].bloodType,
      allergies: body.allergies ?? rows[0].allergies,
      emergencyContact: body.emergencyContact ?? rows[0].emergencyContact,
      encryptionKeyFingerprint: body.encryptionKeyFingerprint ?? rows[0].encryptionKeyFingerprint,
      publicKey: body.publicKey ?? rows[0].publicKey,
    })
    .where(eq(patientsTable.id, rows[0].id))
    .returning();
  return res.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    dateOfBirth: updated.dateOfBirth,
    bloodType: updated.bloodType,
    allergies: updated.allergies,
    emergencyContact: updated.emergencyContact,
    encryptionKeyFingerprint: updated.encryptionKeyFingerprint,
    publicKey: updated.publicKey,
    createdAt: updated.createdAt,
  });
});

export default router;
