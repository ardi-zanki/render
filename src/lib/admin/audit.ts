import { db } from "@/db";
import { adminAuditLogs } from "@/db/schema";

export interface AuditParams {
  adminUserId: string;
  targetUserId?: string;
  action: string;
  entityType?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/** Record an admin action (PRD §28). */
export async function writeAuditLog(p: AuditParams) {
  await db.insert(adminAuditLogs).values({
    adminUserId: p.adminUserId,
    targetUserId: p.targetUserId,
    action: p.action,
    entityType: p.entityType,
    metadata: p.metadata,
    ipAddress: p.ipAddress,
    userAgent: p.userAgent,
  });
}
