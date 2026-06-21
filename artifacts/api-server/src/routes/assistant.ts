import { Router } from "express";
import { db } from "@workspace/db";
import { healthRecordsTable, prescriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/ai/assistant", async (req, res) => {
  const { question } = req.body as { question?: string };
  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "question is required" });
  }

  const records = await db.select().from(healthRecordsTable).orderBy(eq(healthRecordsTable.id, healthRecordsTable.id));
  const prescriptions = await db.select().from(prescriptionsTable).orderBy(eq(prescriptionsTable.id, prescriptionsTable.id));

  const recordSummary = records
    .map((r) => `- ${r.title}: ${r.content ?? "(no content)"}`)
    .join("\n");
  const prescriptionSummary = prescriptions
    .map((p) => `- ${p.medicationName} ${p.dosage} (${p.frequency}) prescribed by ${p.prescribedBy}`)
    .join("\n");

  const prompt = `You are a patient-facing medical assistant. Answer the user's question based on the medical record and prescription data below. Be empathetic, clear, and do not give any diagnosis or medical advice beyond general guidance. If the question asks about medication, include the information from the patient's existing prescriptions when relevant.

Medical records:
${recordSummary || "No medical records available."}

Prescriptions:
${prescriptionSummary || "No prescriptions available."}

User question: ${question}

Answer in plain language, and if you cannot answer from the provided patient data, say so clearly.`;

  // Import and use the OpenAI client dynamically now that we know a key exists
  // If OpenAI is not configured, return a useful local fallback so the UI still gets a helpful answer.
  if (!process.env.OPENAI_API_KEY) {
    const prescriptionList = prescriptionSummary || "No prescriptions available.";
    const fallback = `Local fallback: I don't have access to the AI service right now. Based on the available patient data:\n\nPrescriptions:\n${prescriptionList}\n\nI can't provide medical advice, but if your question is about a medication listed above, please consult your clinician or pharmacist. Enable OPENAI_API_KEY on the server to get AI-generated responses.`;
    return res.json({ answer: fallback });
  }

  const { openai } = await import("../lib/openai");

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const content = completion.choices[0]?.message?.content ?? "";
    return res.json({ answer: content });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Provide a friendly fallback answer in the response body so the frontend can display something useful
    const fallback = `I'm sorry — I couldn't reach the AI service right now. ${errorMessage}`;
    return res.status(502).json({
      error: "AI assistant failed to generate a response.",
      detail: errorMessage,
      answer: fallback,
    });
  }
});

export default router;
