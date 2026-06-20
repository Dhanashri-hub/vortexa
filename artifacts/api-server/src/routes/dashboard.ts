import { Router } from "express";
import { db } from "@workspace/db";
import { healthRecordsTable, prescriptionsTable, accessGrantsTable, alertsTable, activityTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/dashboard/summary", async (req, res) => {
  const [records, prescriptions, grants, alerts, activity] = await Promise.all([
    db.select().from(healthRecordsTable),
    db.select().from(prescriptionsTable),
    db.select().from(accessGrantsTable).where(eq(accessGrantsTable.isActive, true)),
    db.select().from(alertsTable),
    db.select().from(activityTable).orderBy(desc(activityTable.timestamp)).limit(10),
  ]);
  const unresolvedAlerts = alerts.filter((a) => !a.isDismissed);
  const criticalAlerts = unresolvedAlerts.filter((a) => a.severity === "critical");
  return res.json({
    totalRecords: records.length,
    totalPrescriptions: prescriptions.length,
    activeGrants: grants.length,
    unresolvedAlerts: unresolvedAlerts.length,
    criticalAlerts: criticalAlerts.length,
    verifiedRecords: records.filter((r) => r.isVerified).length,
    recentActivity: activity.map((a) => ({
      id: a.id,
      type: a.type,
      description: a.description,
      timestamp: a.timestamp,
    })),
  });
});

export default router;
