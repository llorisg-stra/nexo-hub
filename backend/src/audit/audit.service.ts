import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Log an audit event.
     */
    async log(
        action: string,
        entity: string,
        entityId?: string,
        details?: Record<string, unknown>,
        ip?: string,
    ): Promise<void> {
        try {
            await (this.prisma as any).auditLog.create({
                data: { action, entity, entityId, details: details ?? undefined, ip },
            });
        } catch (err) {
            // Never let audit logging break the main flow
            this.logger.warn(`Failed to write audit log: ${err}`);
        }
    }

    /**
     * Find audit logs with filters and pagination.
     */
    async findAll(params: {
        action?: string;
        entity?: string;
        entityId?: string;
        limit?: number;
        offset?: number;
    }) {
        const { action, entity, entityId, limit = 50, offset = 0 } = params;
        const where: any = {};
        if (action) where.action = action;
        if (entity) where.entity = entity;
        if (entityId) where.entityId = entityId;

        const [data, total] = await Promise.all([
            (this.prisma as any).auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: Math.min(limit, 100),
                skip: offset,
            }),
            (this.prisma as any).auditLog.count({ where }),
        ]);

        return { data, total, limit, offset };
    }

    /**
     * Delete audit logs older than the given number of days.
     */
    async cleanup(olderThanDays = 90): Promise<number> {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - olderThanDays);

        const result = await (this.prisma as any).auditLog.deleteMany({
            where: { createdAt: { lt: cutoff } },
        });

        this.logger.log(`Cleaned up ${result.count} audit logs older than ${olderThanDays} days`);
        return result.count;
    }
}
