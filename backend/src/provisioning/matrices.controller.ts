import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Param,
    Body,
    ParseUUIDPipe,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { ProvisioningService, ProvisionMatrixInput } from './provisioning.service';
import { ModulesService } from '../modules/modules.service';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

class CreateMatrixDto {
    @IsNotEmpty()
    @IsString()
    clientId: string;

    @IsNotEmpty()
    @IsString()
    @Matches(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, {
        message:
            'Slug must be lowercase alphanumeric with hyphens, e.g., "acme-sl"',
    })
    slug: string;

    @IsOptional()
    @IsString()
    vpsNodeId?: string;
}

class MigrateMatrixDto {
    @IsNotEmpty()
    @IsString()
    targetVpsId: string;
}

class OneClickDto {
    @IsNotEmpty()
    @IsString()
    domain: string;

    @IsNotEmpty()
    @IsString()
    adminEmail: string;

    @IsNotEmpty()
    @IsString()
    adminPassword: string;

    // Client: use existing OR create new
    @IsOptional()
    @IsString()
    clientId?: string;

    @IsOptional()
    @IsString()
    clientName?: string;

    // VPS: use existing OR create new
    @IsOptional()
    @IsString()
    vpsNodeId?: string;

    @IsOptional()
    @IsString()
    vpsIp?: string;

    @IsOptional()
    @IsString()
    sshPassword?: string;
}

@Controller('api/matrices')
export class MatricesController {
    constructor(
        private readonly provisioning: ProvisioningService,
        private readonly prisma: PrismaService,
        private readonly modules: ModulesService,
    ) { }

    /**
     * One-click provisioning: auto-creates client + VPS node + provisions.
     * Returns immediately — provisioning runs in background.
     * Poll GET /api/matrices/:id for status updates.
     */
    @Post('one-click')
    async oneClick(@Body() dto: OneClickDto) {
        const slug = dto.domain.split('.')[0];

        // 1. Resolve client: use existing or create new
        let client: any;
        if (dto.clientId) {
            client = await this.prisma.client.findUnique({ where: { id: dto.clientId } });
            if (!client) throw new BadRequestException(`Client ${dto.clientId} not found`);
        } else {
            // Find by email or create
            client = await this.prisma.client.findUnique({ where: { email: dto.adminEmail } });
            if (!client) {
                if (!dto.clientName) throw new BadRequestException('clientName is required when creating a new client');
                client = await this.prisma.client.create({
                    data: {
                        name: dto.clientName,
                        email: dto.adminEmail,
                        company: dto.clientName,
                    },
                });
            }
        }

        // 2. Resolve VPS: use existing or create new
        let vpsNode: any;
        if (dto.vpsNodeId) {
            vpsNode = await this.prisma.vpsNode.findUnique({ where: { id: dto.vpsNodeId } });
            if (!vpsNode) throw new BadRequestException(`VPS Node ${dto.vpsNodeId} not found`);
        } else {
            if (!dto.vpsIp) throw new BadRequestException('vpsIp is required when no vpsNodeId is provided');
            // Find by host IP or create
            vpsNode = await this.prisma.vpsNode.findFirst({ where: { host: dto.vpsIp } });
            if (!vpsNode) {
                if (!dto.sshPassword) throw new BadRequestException('sshPassword is required when creating a new VPS node');
                vpsNode = await this.prisma.vpsNode.create({
                    data: {
                        name: `vps-${slug}`,
                        host: dto.vpsIp,
                        ip: dto.vpsIp,
                        sshUser: 'ubuntu',
                        provider: 'OVH',
                        maxMatrices: 5,
                        notes: `ssh_password:${dto.sshPassword}`,
                    },
                });
            }
        }

        // 3. Init matrix record FIRST (fast, DB only — ensures matrix exists for polling)
        let ctx: any;
        try {
            ctx = await this.provisioning.initProvision({
                clientId: client.id,
                slug,
                vpsNodeId: vpsNode.id,
                adminEmail: dto.adminEmail,
                adminPassword: dto.adminPassword,
            });
        } catch (err: any) {
            // Init failed (slug conflict, no VPS capacity, etc.) — return error immediately
            throw new BadRequestException(err.message || 'Error initializing provisioning');
        }

        // 4. Fire-and-forget: execute pipeline in background (slow, SSH)
        this.provisioning.executeProvision(ctx).catch((err) => {
            console.error(`[OneClick] Pipeline failed for ${slug}:`, err);
        });

        // Return immediately with info for polling
        return {
            status: 'PROVISIONING',
            slug,
            domain: dto.domain,
            clientId: client.id,
            vpsNodeId: vpsNode.id,
            matrixId: ctx.matrix.id,
            message: 'Provisioning started. Poll GET /api/matrices for status.',
        };
    }

    /**
     * Create and provision a new matrix instance.
     */
    @Post()
    async create(@Body() dto: CreateMatrixDto) {
        return this.provisioning.provisionMatrix({
            clientId: dto.clientId,
            slug: dto.slug,
            vpsNodeId: dto.vpsNodeId,
        });
    }

    /**
     * List all matrix instances.
     */
    @Get()
    async findAll() {
        return this.prisma.matrixInstance.findMany({
            where: { deletedAt: null },
            include: {
                client: { select: { name: true, email: true, company: true } },
                vpsNode: { select: { name: true, host: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get a specific matrix with full details.
     */
    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.prisma.matrixInstance.findUniqueOrThrow({
            where: { id },
            include: {
                client: true,
                vpsNode: true,
                events: { orderBy: { createdAt: 'asc' } },
            },
        });
    }

    /**
     * Get provisioning progress for a matrix.
     */
    @Get(':id/events')
    async getEvents(@Param('id', ParseUUIDPipe) id: string) {
        return this.prisma.provisioningEvent.findMany({
            where: { matrixId: id },
            orderBy: { createdAt: 'asc' },
        });
    }

    /**
     * Suspend a matrix (stop containers, keep data).
     */
    @Post(':id/suspend')
    async suspend(@Param('id', ParseUUIDPipe) id: string) {
        await this.provisioning.suspendMatrix(id);
        return { message: 'Matrix suspended' };
    }

    /**
     * Reactivate a suspended matrix.
     */
    @Post(':id/reactivate')
    async reactivate(@Param('id', ParseUUIDPipe) id: string) {
        await this.provisioning.reactivateMatrix(id);
        return { message: 'Matrix reactivated' };
    }

    /**
     * Update a matrix to the latest version.
     * Returns immediately — update runs in background.
     */
    @Post(':id/update')
    async update(@Param('id', ParseUUIDPipe) id: string) {
        // Fire-and-forget: run update in background to avoid HTTP timeout
        this.provisioning.updateMatrix(id).catch((err) => {
            console.error(`[Update] Matrix ${id} update failed:`, err.message);
        });
        return { message: 'Update started', status: 'UPDATING' };
    }

    /**
     * Migrate a matrix to a different VPS node.
     */
    @Post(':id/migrate')
    async migrate(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: MigrateMatrixDto,
    ) {
        const commit = await this.provisioning.migrateMatrix(id, body.targetVpsId);
        return { message: 'Matrix migrated', commit };
    }

    /**
     * Delete a matrix (stop + remove containers + volumes).
     */
    @Post(':id/delete')
    async delete(@Param('id', ParseUUIDPipe) id: string) {
        await this.provisioning.deleteMatrix(id);
        return { message: 'Matrix deleted' };
    }

    /**
     * Rolling update: update all active matrices.
     */
    @Post('actions/update-all')
    async updateAll() {
        return this.provisioning.updateAll();
    }

    /**
     * Patch matrix fields directly (status, gitCommit, provisionLog).
     * Useful for admin fixes when status gets stuck.
     */
    @Patch(':id')
    async patch(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: { status?: string; gitCommit?: string; provisionLog?: string },
    ) {
        const data: any = {};
        if (body.status) data.status = body.status;
        if (body.gitCommit !== undefined) data.gitCommit = body.gitCommit;
        if (body.provisionLog !== undefined) data.provisionLog = body.provisionLog;

        return this.prisma.matrixInstance.update({
            where: { id },
            data,
        });
    }

    // ── Matrix Modules ──

    @Get(':id/modules')
    async getModules(@Param('id', ParseUUIDPipe) id: string) {
        return this.modules.getMatrixModules(id);
    }

    @Put(':id/modules')
    async setModules(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: { modules: string[] },
    ) {
        // 1. Save to DB
        const result = await this.modules.setMatrixModules(id, body.modules);

        // 2. Sync to VPS (update .env + restart container)
        const syncResult = await this.modules.syncModulesToVps(id);

        return { modules: result, sync: syncResult };
    }
}
