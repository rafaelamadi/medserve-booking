import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/api/prisma";

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return value as Prisma.InputJsonValue;
}

/** FR-X1: single writer for staff/system state-change audit entries. */
export async function writeAudit(entry: {
  actorType: "STAFF" | "PATIENT" | "SYSTEM";
  staffId?: string;
  entityType: string;
  entityId: string;
  action: string;
  before?: unknown;
  after?: unknown;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorType: entry.actorType,
      staffId: entry.staffId,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      before: toJson(entry.before),
      after: toJson(entry.after),
    },
  });
}
