import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const accessGrantsTable = pgTable("access_grants", {
  id: serial("id").primaryKey(),
  providerName: text("provider_name").notNull(),
  providerType: text("provider_type").notNull(),
  providerEmail: text("provider_email"),
  grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: text("expires_at"),
  recordScope: text("record_scope").notNull(),
  signatureHash: text("signature_hash").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }),
  accessCount: integer("access_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const auditEntriesTable = pgTable("audit_entries", {
  id: serial("id").primaryKey(),
  grantId: integer("grant_id").notNull(),
  action: text("action").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAccessGrantSchema = createInsertSchema(accessGrantsTable).omit({ id: true, grantedAt: true, createdAt: true, updatedAt: true });
export type InsertAccessGrant = z.infer<typeof insertAccessGrantSchema>;
export type AccessGrant = typeof accessGrantsTable.$inferSelect;
export type AuditEntry = typeof auditEntriesTable.$inferSelect;
