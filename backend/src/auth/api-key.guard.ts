import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const IS_PUBLIC_ENDPOINT = 'isPublicEndpoint';

/**
 * API Key guard for Panel Backend.
 * Validates `X-API-Key` header against PANEL_API_KEY env var.
 * Use @SetMetadata(IS_PUBLIC_ENDPOINT, true) to bypass for health checks.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
    private readonly logger = new Logger(ApiKeyGuard.name);

    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // Check if endpoint is marked as public
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ENDPOINT, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['x-api-key'];
        const validKey = process.env.PANEL_API_KEY;

        if (!validKey) {
            this.logger.error('PANEL_API_KEY env var is not configured — all requests will be rejected');
            throw new UnauthorizedException('Server misconfigured');
        }

        if (!apiKey || apiKey !== validKey) {
            throw new UnauthorizedException('Invalid or missing API key');
        }

        return true;
    }
}
