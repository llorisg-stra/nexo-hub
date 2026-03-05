import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { SshService, SshConnectionConfig } from '../ssh';
import { CreateVpsNodeDto, UpdateVpsNodeDto } from './dto/vps-node.dto';

@Injectable()
export class VpsNodesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly ssh: SshService,
    ) { }

    async create(dto: CreateVpsNodeDto) {
        return this.prisma.vpsNode.create({ data: dto });
    }

    async findAll() {
        return this.prisma.vpsNode.findMany({
            include: {
                matrices: {
                    select: { id: true, slug: true, status: true, slotIndex: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const node = await this.prisma.vpsNode.findUnique({
            where: { id },
            include: { matrices: true },
        });
        if (!node) throw new NotFoundException(`VPS Node ${id} not found`);
        return node;
    }

    async update(id: string, dto: UpdateVpsNodeDto) {
        await this.findOne(id);
        return this.prisma.vpsNode.update({ where: { id }, data: dto });
    }

    async remove(id: string) {
        const node = await this.findOne(id);
        const activeMatrices = (node.matrices || []).filter((m: any) => !m.deletedAt);
        if (activeMatrices.length > 0) {
            throw new BadRequestException(
                `No se puede eliminar: el nodo tiene ${activeMatrices.length} matriz/matrices activa(s). Elimínalas primero.`,
            );
        }
        return this.prisma.vpsNode.delete({ where: { id } });
    }

    /**
     * Find a VPS with available capacity, or throw if none available.
     */
    async findAvailable(): Promise<{ id: string; host: string; sshUser: string; sshKeyPath: string; sshPort: number; notes: string | null; nextSlotIndex: number }> {
        const nodes = await this.prisma.vpsNode.findMany({
            where: { status: 'ACTIVE' },
            include: { matrices: { where: { deletedAt: null } } },
            orderBy: { currentLoad: 'asc' },
        });

        for (const node of nodes) {
            if (node.matrices.length < node.maxMatrices) {
                // Find the next available slot index
                const usedSlots = node.matrices.map((m) => m.slotIndex);
                let nextSlot = 1;
                while (usedSlots.includes(nextSlot)) nextSlot++;

                return {
                    id: node.id,
                    host: node.host,
                    sshUser: node.sshUser,
                    sshKeyPath: node.sshKeyPath,
                    sshPort: node.sshPort,
                    notes: node.notes,
                    nextSlotIndex: nextSlot,
                };
            }
        }

        throw new BadRequestException(
            'No VPS nodes with available capacity. Register a new VPS or increase maxMatrices.',
        );
    }

    /**
     * Get SSH connection config for a VPS node.
     * Supports both key-based and password-based auth.
     * Password is stored in notes as "ssh_password:XXXX".
     */
    getSshConfig(node: {
        host: string;
        sshUser: string;
        sshKeyPath: string;
        sshPort: number;
        notes?: string | null;
    }): SshConnectionConfig {
        // Check if password is stored in notes (supports both formats)
        const passwordMatch = node.notes?.match(/(?:ssh_password:|\[SSH_PASS:)(\S+?)\]?(?:\s|$)/);
        if (passwordMatch) {
            return {
                host: node.host,
                username: node.sshUser,
                password: passwordMatch[1],
                port: node.sshPort,
            };
        }
        return {
            host: node.host,
            username: node.sshUser,
            privateKeyPath: node.sshKeyPath,
            port: node.sshPort,
        };
    }

    /**
     * Test SSH connectivity to a VPS node.
     */
    async testConnection(id: string): Promise<{ connected: boolean }> {
        const node = await this.findOne(id);
        const connected = await this.ssh.testConnection(this.getSshConfig(node));
        return { connected };
    }

    /**
     * Get system stats from a VPS node via SSH.
     * Includes per-container Docker stats grouped by matrix.
     */
    async getStats(id: string) {
        const node = await this.findOne(id);
        const config = this.getSshConfig(node);

        const [diskResult, ramResult, uptimeResult, dockerResult, cpuResult] = await Promise.all([
            this.ssh.exec(config, "df -h / | tail -1 | awk '{print $2, $3, $5}'"),
            this.ssh.exec(config, "free -m | grep Mem | awk '{print $2, $3}'"),
            this.ssh.exec(config, 'uptime -p'),
            this.ssh.exec(config, 'docker stats --no-stream --format "{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}" 2>/dev/null || echo ""'),
            this.ssh.exec(config, 'nproc'),
        ]);

        // Parse docker stats into per-matrix groups
        const containers: { name: string; cpu: string; mem: string; memPerc: string; matrix: string }[] = [];
        const lines = dockerResult.stdout.trim().split('\n').filter(l => l.includes('|'));
        for (const line of lines) {
            const [name, cpu, mem, memPerc] = line.split('|');
            // Extract matrix slug: "matriz-strategialabs-backend" -> "strategialabs"
            const matrix = name?.trim().replace(/^matriz-/, '').replace(/-(?:backend|frontend|db|postgres|redis|n8n|adminer)(?:-\d+)?$/, '') || name?.trim();
            containers.push({ name: name?.trim(), cpu: cpu?.trim(), mem: mem?.trim(), memPerc: memPerc?.trim(), matrix: matrix?.trim() });
        }

        // Group by matrix, sum CPU and RAM
        const matrixStats: Record<string, { cpu: number; ramMb: number; containers: number }> = {};
        for (const c of containers) {
            if (!matrixStats[c.matrix]) {
                matrixStats[c.matrix] = { cpu: 0, ramMb: 0, containers: 0 };
            }
            matrixStats[c.matrix].containers++;
            matrixStats[c.matrix].cpu += parseFloat(c.cpu?.replace('%', '') || '0');
            // Parse RAM: "149.4MiB / 7.57GiB" -> 149.4
            const ramMatch = c.mem?.match(/([\d.]+)\s*MiB/);
            if (ramMatch) matrixStats[c.matrix].ramMb += parseFloat(ramMatch[1]);
            const ramGb = c.mem?.match(/([\d.]+)\s*GiB/);
            if (ramGb && !ramMatch) matrixStats[c.matrix].ramMb += parseFloat(ramGb[1]) * 1024;
        }

        return {
            disk: diskResult.stdout.trim(),
            ram: ramResult.stdout.trim(),
            uptime: uptimeResult.stdout.trim(),
            cpuCores: parseInt(cpuResult.stdout.trim()) || 1,
            matrixStats,
        };
    }

    /**
     * Reboot a VPS node. Containers with restart:unless-stopped will auto-recover.
     */
    async reboot(id: string) {
        const node = await this.findOne(id);
        const config = this.getSshConfig(node);
        try {
            await this.ssh.exec(config, 'sudo reboot');
        } catch {
            // SSH connection drops during reboot — expected
        }
        return { message: `Reboot enviado a ${node.name}. El servidor volverá en ~1-2 minutos.` };
    }
}
