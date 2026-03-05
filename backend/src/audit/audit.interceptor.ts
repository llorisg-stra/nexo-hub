import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';

const METHOD_TO_ACTION: Record<string, string> = {
    POST: 'CREATE',
    PATCH: 'UPDATE',
    PUT: 'UPDATE',
    DELETE: 'DELETE',
};

// Paths to skip audit logging
const SKIP_PATHS = ['/api/audit-logs', '/api/health', '/api/login'];

/**
 * Global interceptor that auto-logs write operations (POST, PATCH, PUT, DELETE).
 * Extracts entity name and ID from the URL path.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
    private readonly logger = new Logger(AuditInterceptor.name);

    constructor(private readonly audit: AuditService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const method: string = request.method;

        // Skip GET requests and excluded paths
        if (method === 'GET') return next.handle();

        const path: string = request.url?.split('?')[0] || '';
        if (SKIP_PATHS.some((p) => path.startsWith(p))) return next.handle();

        const action = METHOD_TO_ACTION[method] || method;
        const { entity, entityId } = this.extractEntityFromPath(path);
        const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';
        const body = request.body;

        return next.handle().pipe(
            tap({
                next: (responseBody) => {
                    // Log successful operations
                    const details: Record<string, unknown> = {};
                    if (body && Object.keys(body).length > 0) {
                        // Redact sensitive fields
                        const sanitized = { ...body };
                        for (const key of ['password', 'sshPassword', 'adminPassword', 'apiKey']) {
                            if (sanitized[key]) sanitized[key] = '***';
                        }
                        details.payload = sanitized;
                    }
                    if (responseBody?.id) {
                        details.resultId = responseBody.id;
                    }

                    const logEntityId = entityId || responseBody?.id || undefined;
                    this.audit.log(action, entity, logEntityId, details, ip).catch(() => { });
                },
                error: (err) => {
                    // Log failed operations too
                    this.audit.log(
                        `${action}_FAILED`,
                        entity,
                        entityId,
                        { error: err.message, statusCode: err.status },
                        ip,
                    ).catch(() => { });
                },
            }),
        );
    }

    /**
     * Extract entity name and optional ID from API path.
     * Example: /api/clients/abc-123 → { entity: 'client', entityId: 'abc-123' }
     */
    private extractEntityFromPath(path: string): { entity: string; entityId?: string } {
        const segments = path.replace('/api/', '').split('/').filter(Boolean);
        if (segments.length === 0) return { entity: 'unknown' };

        // Singularize: "clients" → "client", "matrices" → "matrix"
        let entity = segments[0];
        if (entity.endsWith('ices')) entity = entity.replace(/ices$/, 'ix'); // matrices → matrix
        else if (entity.endsWith('s')) entity = entity.slice(0, -1); // clients → client

        // Map special paths
        const entityMap: Record<string, string> = {
            'vps-node': 'vpsNode',
            'audit-log': 'auditLog',
            'plugin-catalog': 'plugin',
        };
        entity = entityMap[entity] || entity;

        const entityId = segments[1] || undefined;
        // Sub-actions: /api/matrices/one-click → action override
        if (entityId && !this.looksLikeUuid(entityId)) {
            return { entity: `${entity}/${entityId}` };
        }

        return { entity, entityId };
    }

    private looksLikeUuid(s: string): boolean {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
    }
}
