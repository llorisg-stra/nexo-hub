import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkerNodeDto, UpdateWorkerNodeDto, WorkerHeartbeatDto } from './dto/worker-node.dto';

@Injectable()
export class WorkersService {
    private readonly logger = new Logger(WorkersService.name);

    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateWorkerNodeDto) {
        return this.prisma.workerNode.create({
            data: {
                name: dto.name,
                host: dto.host,
                apiPort: dto.apiPort ?? 8080,
                notes: dto.notes,
            },
        });
    }

    async findAll() {
        return this.prisma.workerNode.findMany({
            orderBy: { createdAt: 'asc' },
        });
    }

    async findOne(id: string) {
        const node = await this.prisma.workerNode.findUnique({ where: { id } });
        if (!node) throw new NotFoundException(`Worker ${id} not found`);
        return node;
    }

    async update(id: string, dto: UpdateWorkerNodeDto) {
        await this.findOne(id);
        return this.prisma.workerNode.update({
            where: { id },
            data: dto,
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.workerNode.delete({ where: { id } });
    }

    /**
     * Heartbeat from worker — updates status and metrics.
     */
    async heartbeat(dto: WorkerHeartbeatDto) {
        const node = await this.prisma.workerNode.findFirst({
            where: { name: dto.workerId },
        });
        if (!node) {
            this.logger.warn(`Heartbeat from unknown worker: ${dto.workerId}`);
            throw new NotFoundException(`Worker ${dto.workerId} not registered`);
        }

        return this.prisma.workerNode.update({
            where: { id: node.id },
            data: {
                status: 'ONLINE',
                lastHeartbeat: new Date(),
                cpuCores: dto.cpuCores,
                ramTotalMb: dto.ramTotalMb,
                ramUsedMb: dto.ramUsedMb,
                activeJobs: dto.activeJobs ?? 0,
                totalProcessed: dto.totalProcessed ?? 0,
            },
        });
    }

    /**
     * Fetch live status from the worker's health API.
     */
    async getLiveStatus(id: string) {
        const node = await this.findOne(id);
        const url = `http://${node.host}:${node.apiPort}/status`;
        try {
            const response = await fetch(url, {
                signal: AbortSignal.timeout(5000),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            // Update DB with fresh data
            await this.prisma.workerNode.update({
                where: { id },
                data: {
                    status: 'ONLINE',
                    lastHeartbeat: new Date(),
                    cpuCores: data.system?.cpuCores,
                    ramTotalMb: data.system?.totalMemoryMb,
                    ramUsedMb: data.system?.totalMemoryMb - (data.system?.freeMemoryMb || 0),
                    activeJobs: data.matrices?.reduce((sum: number, m: any) => sum + (m.activeJobs || 0), 0) ?? 0,
                    totalProcessed: data.matrices?.reduce((sum: number, m: any) => sum + (m.completedJobs || 0), 0) ?? 0,
                },
            });

            return { connected: true, ...data };
        } catch (error) {
            await this.prisma.workerNode.update({
                where: { id },
                data: { status: 'OFFLINE' },
            });
            return { connected: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    /**
     * Every 60 seconds, mark workers with stale heartbeats as OFFLINE.
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async checkHeartbeats() {
        const staleThreshold = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes
        const result = await this.prisma.workerNode.updateMany({
            where: {
                status: 'ONLINE',
                OR: [
                    { lastHeartbeat: { lt: staleThreshold } },
                    { lastHeartbeat: null },
                ],
            },
            data: { status: 'OFFLINE' },
        });
        if (result.count > 0) {
            this.logger.warn(`Marked ${result.count} worker(s) as OFFLINE (stale heartbeat)`);
        }
    }
}
