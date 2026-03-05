import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreatePluginTemplateDto, UpdatePluginTemplateDto } from './dto/plugin-template.dto';
import type { Prisma } from '@prisma/client';

@Injectable()
export class PluginCatalogService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreatePluginTemplateDto) {
        // Check for duplicate name
        const existing = await this.prisma.pluginTemplate.findUnique({
            where: { name: dto.name },
        });
        if (existing) {
            throw new ConflictException(`Plugin with name "${dto.name}" already exists`);
        }

        const data: Prisma.PluginTemplateCreateInput = {
            name: dto.name,
            description: dto.description,
            code: dto.code,
            version: dto.version ?? '1.0.0',
            author: dto.author ?? 'Strategia Laboratory',
            icon: dto.icon,
            tags: dto.tags ?? [],
            supportedChannels: dto.supportedChannels ?? [],
            configSchema: dto.configSchema as Prisma.InputJsonValue,
        };
        return this.prisma.pluginTemplate.create({ data });
    }

    async findAll(status?: string) {
        const where: Prisma.PluginTemplateWhereInput = {};
        if (status) {
            where.status = status as any;
        }
        return this.prisma.pluginTemplate.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
        });
    }

    async findPublished() {
        return this.prisma.pluginTemplate.findMany({
            where: { status: 'PUBLISHED' },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const plugin = await this.prisma.pluginTemplate.findUnique({
            where: { id },
        });
        if (!plugin) throw new NotFoundException(`Plugin ${id} not found`);
        return plugin;
    }

    async update(id: string, dto: UpdatePluginTemplateDto) {
        await this.findOne(id);
        const data: Prisma.PluginTemplateUpdateInput = {};
        if (dto.name !== undefined) data.name = dto.name;
        if (dto.description !== undefined) data.description = dto.description;
        if (dto.code !== undefined) data.code = dto.code;
        if (dto.version !== undefined) data.version = dto.version;
        if (dto.author !== undefined) data.author = dto.author;
        if (dto.icon !== undefined) data.icon = dto.icon;
        if (dto.tags !== undefined) data.tags = dto.tags;
        if (dto.supportedChannels !== undefined) data.supportedChannels = dto.supportedChannels;
        if (dto.configSchema !== undefined) data.configSchema = dto.configSchema as Prisma.InputJsonValue;
        if (dto.status !== undefined) data.status = dto.status;
        return this.prisma.pluginTemplate.update({ where: { id }, data });
    }

    async publish(id: string) {
        await this.findOne(id);
        return this.prisma.pluginTemplate.update({
            where: { id },
            data: { status: 'PUBLISHED' },
        });
    }

    async unpublish(id: string) {
        await this.findOne(id);
        return this.prisma.pluginTemplate.update({
            where: { id },
            data: { status: 'DRAFT' },
        });
    }

    async archive(id: string) {
        await this.findOne(id);
        return this.prisma.pluginTemplate.update({
            where: { id },
            data: { status: 'ARCHIVED' },
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.pluginTemplate.delete({ where: { id } });
    }
}
