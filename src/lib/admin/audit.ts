import { count, desc, inArray } from "drizzle-orm";

import { db } from "@/db";
import { adminAuditLogs, user } from "@/db/schema";

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

export async function listAuditLogs(limit = 100, offset = 0) {
  const logs = await db.query.adminAuditLogs.findMany({
    orderBy: desc(adminAuditLogs.createdAt),
    limit,
    offset,
  });
  if (logs.length === 0) return [];

  const ids = Array.from(
    new Set(
      logs.flatMap((l) =>
        [l.adminUserId, l.targetUserId].filter((x): x is string => !!x),
      ),
    ),
  );
  const users = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(inArray(user.id, ids));
  const nameById = new Map(users.map((u) => [u.id, u.name]));

  return logs.map((l) => ({
    id: l.id,
    action: l.action,
    adminName: nameById.get(l.adminUserId) ?? "—",
    targetName: l.targetUserId ? nameById.get(l.targetUserId) ?? "—" : null,
    metadata: l.metadata as Record<string, unknown> | null,
    createdAt: l.createdAt,
  }));
}

export async function countAuditLogs(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(adminAuditLogs);
  return row.value;
}
