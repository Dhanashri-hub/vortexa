import { Router } from "express";
import { db } from "@workspace/db";
import { prescriptionsTable, alertsTable, activityTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { openai } from "../lib/openai";

const router = Router();

async function runOpenAICompletion(prompt: string, fallback?: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    return completion.choices[0]?.message?.content ?? "{}";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // If a fallback is provided, return it so the UI gets a helpful stub
    if (fallback) {
      console.warn(`OpenAI request failed, returning fallback: ${message}`);
      return fallback;
    }
    throw new Error(`OpenAI request failed: ${message}`);
  }
}

function parseAnalysisResponse(content: string, type: "safety" | "fraud") {
  try {
    return JSON.parse(content);
  } catch {
    throw new Error(`AI ${type} analysis returned invalid JSON. Response: ${content}`);
  }
}

async function createAlerts(alerts: Array<any>, type: "safety" | "fraud") {
  const createdAlerts = [];
  for (const alert of alerts) {
    const [inserted] = await db.insert(alertsTable).values({
      type,
      severity: alert.severity ?? "medium",
      title: alert.title ?? (type === "fraud" ? "Suspicious prescription pattern" : "Potential safety concern"),
      description: alert.description ?? "Review this prescription.",
      relatedIds: Array.isArray(alert.relatedMeds) ? alert.relatedMeds.join(",") : String(alert.relatedMeds ?? ""),
      isDismissed: false,
      timestamp: new Date().toISOString(),
    }).returning();
    createdAlerts.push(inserted);
  }
  return createdAlerts;
}

async function analyzeSafetyHandler(_req: any, res: any) {
  try {
    const prescriptions = await db.select().from(prescriptionsTable).where(eq(prescriptionsTable.status, "active"));
    const drugList = prescriptions.map((p) => `${p.medicationName} ${p.dosage} (${p.frequency})`).join(", ");
    const prompt = `You are a clinical pharmacist reviewing a patient's active medications for safety issues. The patient has the following active prescriptions: ${drugList}. Identify any potential drug interactions, contraindications, or safety concerns. Be specific and cite the medications involved. If no issues are found, say so clearly. Respond in JSON format with fields: "hasConcerns" (boolean), "alerts" (array of objects with "severity" (critical/high/medium/low), "title", "description", "relatedMeds").`;

    const safetyFallback = JSON.stringify({ hasConcerns: false, alerts: [], note: "OpenAI unavailable — fallback safety analysis generated locally." });
    const content = await runOpenAICompletion(prompt, safetyFallback);
    const parsed = parseAnalysisResponse(content, "safety");
    const warnings = Array.isArray(parsed.alerts) ? parsed.alerts : [];
    const createdAlerts = await createAlerts(warnings, "safety");

    if (createdAlerts.length > 0) {
      await db.insert(activityTable).values({
        type: "alert_triggered",
        description: `AI safety analysis found ${createdAlerts.length} concern(s)`,
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({
      analysisComplete: true,
      hasConcerns: Boolean(parsed.hasConcerns),
      alertsCreated: createdAlerts.length,
      alerts: createdAlerts.map((a) => ({
        id: a.id,
        type: a.type,
        severity: a.severity,
        title: a.title,
        description: a.description,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(502).json({ error: "AI safety analysis failed.", detail: message });
  }
}

// Accept both /ai/analyze/safety and /ai/analyze-safety (frontend uses hyphenated path)
router.post("/ai/analyze/safety", analyzeSafetyHandler);
router.post("/ai/analyze-safety", analyzeSafetyHandler);

async function analyzeFraudHandler(_req: any, res: any) {
  try {
    const prescriptions = await db.select().from(prescriptionsTable).orderBy(desc(prescriptionsTable.createdAt));
    const prescSummary = prescriptions
      .map((p) => `${p.medicationName} ${p.dosage}, prescribed by ${p.prescribedBy} on ${p.prescribedAt} (NPI: ${p.npiNumber ?? "unknown"})`)
      .join("\n");
    const prompt = `You are a healthcare fraud analyst. Review the following prescription records for suspicious patterns such as: multiple controlled substances from different prescribers (doctor shopping), unusually high quantities, prescriptions from providers with no matching NPI, duplicate fills, or other fraud indicators.\n\nPrescriptions:\n${prescSummary}\n\nRespond in JSON format with fields: "hasConcerns" (boolean), "alerts" (array of objects with "severity" (critical/high/medium/low), "title", "description", "relatedMeds").`;

    const fraudFallback = JSON.stringify({ hasConcerns: false, alerts: [], note: "OpenAI unavailable — fallback fraud analysis generated locally." });
    const content = await runOpenAICompletion(prompt, fraudFallback);
    const parsed = parseAnalysisResponse(content, "fraud");
    const alerts = Array.isArray(parsed.alerts) ? parsed.alerts : [];
    const createdAlerts = await createAlerts(alerts, "fraud");

    if (createdAlerts.length > 0) {
      await db.insert(activityTable).values({
        type: "alert_triggered",
        description: `AI fraud analysis found ${createdAlerts.length} concern(s)`,
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({
      analysisComplete: true,
      hasConcerns: Boolean(parsed.hasConcerns),
      alertsCreated: createdAlerts.length,
      alerts: createdAlerts.map((a) => ({
        id: a.id,
        type: a.type,
        severity: a.severity,
        title: a.title,
        description: a.description,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(502).json({ error: "AI fraud analysis failed.", detail: message });
  }
}

// Accept both /ai/analyze/fraud and /ai/analyze-fraud (frontend uses hyphenated path)
router.post("/ai/analyze/fraud", analyzeFraudHandler);
router.post("/ai/analyze-fraud", analyzeFraudHandler);

router.get("/ai/alerts/:id/explain", async (req, res) => {
  const rows = await db.select().from(alertsTable).where(eq(alertsTable.id, Number(req.params.id)));
  if (rows.length === 0) return res.status(404).json({ error: "Alert not found" });
  const alert = rows[0];
  const prompt = `You are a medical AI assistant. Explain the following health alert to a patient in clear, plain English without medical jargon. Be empathetic and actionable.\n\nAlert: ${alert.title}\nDescription: ${alert.description}\nSeverity: ${alert.severity}\nType: ${alert.type}\n\nProvide: 1) A simple explanation of what the concern is, 2) Why it matters, 3) What the patient should do next. Keep it to 3-4 sentences total.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    return res.json({
      id: alert.id,
      explanation: completion.choices[0].message.content ?? "",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(502).json({ error: "Alert explanation failed.", detail: message });
  }
});

export default router;
