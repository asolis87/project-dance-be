import { randomUUID } from 'crypto';
import { FastifyRequest } from 'fastify';
import { db } from '../../lib/db';
import { logger } from '../../lib/logger';

export interface AuditLogEntry {
  action: string;
  resource: string;
  resourceId?: string;
  organizationId?: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    await db.insertInto('audit_log').values({
      action: entry.action,
      resource: entry.resource,
      resource_id: entry.resourceId,
      organization_id: entry.organizationId,
      user_id: entry.userId,
      request_id: entry.requestId,
      metadata: JSON.stringify(entry.metadata || {}),
      created_at: new Date(),
    }).execute();
  } catch (error) {
    logger.error({ err: error, entry }, 'Failed to write audit log');
  }
}

export function getRequestId(request: FastifyRequest): string {
  return (request.headers['x-request-id'] as string) || randomUUID();
}

export function getUserId(request: FastifyRequest): string | undefined {
  return request.headers['x-user-id'] as string | undefined;
}
