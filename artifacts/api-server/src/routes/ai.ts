import { Router } from "express";
import { db } from "@workspace/db";
import { prescriptionsTable, healthRecordsTable, alertsTable, activityTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { openai } from "../lib/openai";

const router = Router();

router.post("/ai/analyze/safety", async (req, res) => {
  const prescriptions = await db.select().from(prescriptionsTable).where(eq(prescriptionsTable.status, "active"));
  const drugList = prescriptions.map((p) => `${p.medicationName} ${p.dosage} (${p.frequency})`).join(", ");
  const prompt = `You are a clinical pharmacist reviewing a patient's active medications for safety issues. The patient has the following active prescriptions: ${drugList}. Identify any potential drug interactions, contraindications, or safety concerns. Be specific and cite the medications involved. If no issues are found, say so clearly. Respond in JSON format with fields: "hasConcerns" (boolean), "alerts" (array of objects with "severity" (critical/high/medium/low), "title", "description", "relatedMeds").`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });
  const content = completion.choices[0].message.content ?? "{}";
  let parsed: { hasConcerns?: boolean; alerts?: Array<{ severity: string; title: string; description: string; relatedMeds: string[] }> } = {};
  try { parsed = JSON.parse(content); } catch {}

  const createdAlerts = [];
  if (parsed.hasConcerns && parsed.alerts) {
    for (const alert of parsed.alerts) {
      const [inserted] = await db.insert(alertsTable).values({
        type: "safety",
        severity: alert.severity ?? "medium",
        title: alert.title,
        description: alert.description,
        relatedIds: (alert.relatedMeds ?? []).join(","),
        isDismissed: false,
      }).returning();
      createdAlerts.push(inserted);
    }
    if (createdAlerts.length > 0) {
      await db.insert(activityTable).values({
        type: "alert_triggered",
        description: `AI safety analysis found ${createdAlerts.length} concern(s)`,
      });
    }
  }
  return res.json({
    analysisComplete: true,
    hasConcerns: parsed.hasConcerns ?? false,
    alertsCreated: createdAlerts.length,
    alerts: createdAlerts.map((a) => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      title: a.title,
      description: a.description,
    })),
  });
});

router.post("/ai/analyze/fraud", async (req, res) => {
  const prescriptions = await db.select().from(prescriptionsTable).orderBy(desc(prescriptionsTable.createdAt));
  const prescSummary = prescriptions.map((p) => `${p.medicationName} ${p.dosage}, prescribed by ${p.prescribedBy} on ${p.prescribedAt} (NPI: ${p.npiNumber ?? "unknown"})`).join("\n");
  const prompt = `You are a healthcare fraud analyst. Review the following prescription records for suspicious patterns such as: multiple controlled substances from different prescribers (doctor shopping), unusually high quantities, prescriptions from providers with no matching NPI, duplicate fills, or other fraud indicators.\n\nPrescriptions:\n${prescSummary}\n\nRespond in JSON format with fields: "hasConcerns" (boolean), "alerts" (array of objects with "severity" (critical/high/medium/low), "title", "description", "relatedMeds").`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });
  const content = completion.choices[0].message.content ?? "{}";
  let parsed: { hasConcerns?: boolean; alerts?: Array<{ severity: string; title: string; description: string; relatedMeds: string[] }> } = {};
  try { parsed = JSON.parse(content); } catch {}

  const createdAlerts = [];
  if (parsed.hasConcerns && parsed.alerts) {
    for (const alert of parsed.alerts) {
      const [inserted] = await db.insert(alertsTable).values({
        type: "fraud",
        severity: alert.severity ?? "medium",
        title: alert.title,
        description: alert.description,
        relatedIds: (alert.relatedMeds ?? []).join(","),
        isDismissed: false,
      }).returning();
      createdAlerts.push(inserted);
    }
    if (createdAlerts.length > 0) {
      await db.insert(activityTable).values({
        type: "alert_triggered",
        description: `AI fraud analysis found ${createdAlerts.length} concern(s)`,
      });
    }
  }
  return res.json({
    analysisComplete: true,
    hasConcerns: parsed.hasConcerns ?? false,
    alertsCreated: createdAlerts.length,
    alerts: createdAlerts.map((a) => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      title: a.title,
      description: a.description,
    })),
  });
});

router.get("/ai/alerts/:id/explain", async (req, res) => {
  const rows = await db.select().from(alertsTable).where(eq(alertsTable.id, Number(req.params.id)));
  if (rows.length === 0) return res.status(404).json({ error: "Alert not found" });
  const alert = rows[0];
  const prompt = `You are a medical AI assistant. Explain the following health alert to a patient in clear, plain English without medical jargon. Be empathetic and actionable.\n\nAlert: ${alert.title}\nDescription: ${alert.description}\nSeverity: ${alert.severity}\nType: ${alert.type}\n\nProvide: 1) A simple explanation of what the concern is, 2) Why it matters, 3) What the patient should do next. Keep it to 3-4 sentences total.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });
  return res.json({
    id: alert.id,
    explanation: completion.choices[0].message.content ?? "",
  });
});

export default router;
