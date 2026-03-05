import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('api/audit-logs')
export class AuditController {
    constructor(private readonly audit: AuditService) { }

    @Get()
    findAll(
        @Query('action') action?: string,
        @Query('entity') entity?: string,
        @Query('entityId') entityId?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.audit.findAll({
            action,
            entity,
            entityId,
            limit: limit ? parseInt(limit, 10) : 50,
            offset: offset ? parseInt(offset, 10) : 0,
        });
    }
}
