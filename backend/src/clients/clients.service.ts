import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
import { SupabaseAdminService } from '../provisioning/supabase-admin.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class ClientsService {
    private readonly logger = new Logger(ClientsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly supabaseAdmin: SupabaseAdminService,
    ) { }

    async create(dto: CreateClientDto) {
        const data: Prisma.ClientCreateInput = {
            name: dto.name,
            email: dto.email,
            company: dto.company,
            phone: dto.phone,
            plan: dto.plan,
            notes: dto.notes,
            metadata: dto.metadata as Prisma.InputJsonValue,
        };
        return this.prisma.client.create({ data });
    }

    async findAll(includeDeleted = false) {
        return this.prisma.client.findMany({
            where: includeDeleted ? {} : { deletedAt: null },
            include: { matrices: { select: { id: true, slug: true, status: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const client = await this.prisma.client.findUnique({
            where: { id },
            include: {
                matrices: {
                    include: { vpsNode: { select: { name: true, host: true } } },
                },
            },
        });
        if (!client) throw new NotFoundException(`Client ${id} not found`);
        return client;
    }

    async update(id: string, dto: UpdateClientDto) {
        const client = await this.findOne(id);
        const data: Prisma.ClientUpdateInput = {};
        if (dto.name !== undefined) data.name = dto.name;
        if (dto.email !== undefined) data.email = dto.email;
        if (dto.company !== undefined) data.company = dto.company;
        if (dto.phone !== undefined) data.phone = dto.phone;
        if (dto.plan !== undefined) data.plan = dto.plan;
        if (dto.notes !== undefined) data.notes = dto.notes;
        if (dto.metadata !== undefined) data.metadata = dto.metadata as Prisma.InputJsonValue;

        const updated = await this.prisma.client.update({ where: { id }, data });

        // Sync email change to Supabase Auth for all active matrices
        if (dto.email && dto.email !== client.email && this.supabaseAdmin.isConfigured) {
            const matrices = await this.prisma.matrixInstance.findMany({
                where: { clientId: id, deletedAt: null },
            });

            for (const matrix of matrices) {
                const supabaseUserId = (matrix as any).adminSupabaseId;
                if (supabaseUserId) {
                    const ok = await this.supabaseAdmin.updateUserEmail(supabaseUserId, dto.email);
                    if (ok) {
                        this.logger.log(`Synced email to Supabase for matrix ${matrix.slug} (user ${supabaseUserId})`);
                    } else {
                        this.logger.warn(`Failed to sync email to Supabase for matrix ${matrix.slug}`);
                    }
                }
            }
        }

        return updated;
    }

    async softDelete(id: string) {
        await this.findOne(id);
        return this.prisma.client.update({
            where: { id },
            data: { deletedAt: new Date(), status: 'CANCELLED' },
        });
    }

    async findByStripeCustomer(stripeCustomerId: string) {
        return this.prisma.client.findUnique({
            where: { stripeCustomerId },
        });
    }
}
