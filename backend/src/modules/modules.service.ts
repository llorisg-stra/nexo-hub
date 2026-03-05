import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SshService, SshConnectionConfig } from '../ssh/ssh.service';

@Injectable()
export class ModulesService {
    private readonly logger = new Logger(ModulesService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly ssh: SshService,
    ) { }

    // ── Catalog CRUD ──

    async findAll() {
        return this.prisma.moduleDefinition.findMany({
            orderBy: { name: 'asc' },
            include: {
                matrices: { select: { matrixId: true } },
            },
        });
    }

    async findOne(id: string) {
        const mod = await this.prisma.moduleDefinition.findUnique({
            where: { id },
            include: {
                matrices: {
                    include: { matrix: { select: { id: true, slug: true, subdomain: true } } },
                },
            },
        });
        if (!mod) throw new NotFoundException(`Module ${id} not found`);
        return mod;
    }

    async create(data: { name: string; slug: string; description?: string; icon?: string; category?: string; isCore?: boolean }) {
        const existing = await this.prisma.moduleDefinition.findUnique({ where: { slug: data.slug } });
        if (existing) throw new ConflictException(`Module slug "${data.slug}" already exists`);

        return this.prisma.moduleDefinition.create({ data });
    }

    async update(id: string, data: { name?: string; description?: string; icon?: string; category?: string; isCore?: boolean }) {
        await this.findOne(id);
        return this.prisma.moduleDefinition.update({ where: { id }, data });
    }

    async remove(id: string) {
        await this.findOne(id);
        // Delete all assignments first
        await this.prisma.matrixModule.deleteMany({ where: { moduleId: id } });
        return this.prisma.moduleDefinition.delete({ where: { id } });
    }

    // ── Matrix-Module assignments ──

    async getMatrixModules(matrixId: string) {
        return this.prisma.matrixModule.findMany({
            where: { matrixId },
            include: { module: true },
            orderBy: { module: { name: 'asc' } },
        });
    }

    async setMatrixModules(matrixId: string, moduleSlugs: string[]) {
        // Verify matrix exists
        const matrix = await this.prisma.matrixInstance.findUnique({ where: { id: matrixId } });
        if (!matrix) throw new NotFoundException(`Matrix ${matrixId} not found`);

        // Get module IDs from slugs
        const modules = await this.prisma.moduleDefinition.findMany({
            where: { slug: { in: moduleSlugs } },
        });

        // Always include core modules
        const coreModules = await this.prisma.moduleDefinition.findMany({
            where: { isCore: true },
        });

        const allModuleIds = [
            ...new Set([
                ...modules.map((m) => m.id),
                ...coreModules.map((m) => m.id),
            ]),
        ];

        // Replace all assignments
        await this.prisma.matrixModule.deleteMany({ where: { matrixId } });
        await this.prisma.matrixModule.createMany({
            data: allModuleIds.map((moduleId) => ({ matrixId, moduleId })),
        });

        return this.getMatrixModules(matrixId);
    }

    // ── VPS Sync ──

    /**
     * Sync active modules to the VPS where this matrix runs.
     *
     * 1. Reads the matrix + VPS node from DB
     * 2. Builds ACTIVE_MODULES string from non-core module slugs
     * 3. SSHs into VPS and updates ACTIVE_MODULES in .env
     * 4. Restarts the backend Docker container
     *
     * This runs AFTER setMatrixModules() so the DB is already up to date.
     */
    async syncModulesToVps(matrixId: string): Promise<{ synced: boolean; modules: string; message: string }> {
        // 1. Get matrix
        const matrix = await this.prisma.matrixInstance.findUnique({
            where: { id: matrixId },
        });
        if (!matrix) throw new NotFoundException(`Matrix ${matrixId} not found`);

        // Get VPS node
        const vpsNode = await this.prisma.vpsNode.findUnique({
            where: { id: matrix.vpsNodeId },
        });
        if (!vpsNode) throw new NotFoundException(`VPS node ${matrix.vpsNodeId} not found`);

        // Get active modules for this matrix
        const matrixModules = await this.prisma.matrixModule.findMany({
            where: { matrixId },
            include: { module: true },
        });

        // 2. Build ACTIVE_MODULES value (only non-core module slugs)
        const activeModuleSlugs = matrixModules
            .filter((mm) => !mm.module.isCore)
            .map((mm) => mm.module.slug)
            .join(',');

        this.logger.log(
            `[Sync] Matrix "${matrix.slug}" → ACTIVE_MODULES=${activeModuleSlugs || '(empty)'}`,
        );

        // 3. Build SSH config from VPS node
        const sshConfig = this.buildSshConfig(vpsNode);

        // 4. Update .env and restart container
        const envPath = `${matrix.dockerComposeDir}/.env`;
        const containerName = `${matrix.slug === 'matriz-dev' ? 'matriz' : matrix.slug}-backend`;

        try {
            // Update ACTIVE_MODULES in .env (add if not exists, replace if exists)
            const sedCmd = activeModuleSlugs
                ? `grep -q '^ACTIVE_MODULES=' ${envPath} && sed -i 's/^ACTIVE_MODULES=.*/ACTIVE_MODULES=${activeModuleSlugs}/' ${envPath} || echo 'ACTIVE_MODULES=${activeModuleSlugs}' >> ${envPath}`
                : `sed -i 's/^ACTIVE_MODULES=.*/ACTIVE_MODULES=/' ${envPath}`;

            const sedResult = await this.ssh.exec(sshConfig, sedCmd);
            if (!sedResult.success) {
                this.logger.error(`[Sync] Failed to update .env: ${sedResult.stderr}`);
                return { synced: false, modules: activeModuleSlugs, message: `Error updating .env: ${sedResult.stderr}` };
            }

            // Verify
            const verifyResult = await this.ssh.exec(sshConfig, `grep ACTIVE_MODULES ${envPath}`);
            this.logger.log(`[Sync] .env verified: ${verifyResult.stdout.trim()}`);

            // Recreate backend container (docker compose re-reads .env; docker restart does NOT)
            const restartResult = await this.ssh.exec(
                sshConfig,
                `cd ${matrix.dockerComposeDir} && docker compose up -d backend`,
            );

            if (!restartResult.success) {
                this.logger.error(`[Sync] Failed to restart container: ${restartResult.stderr}`);
                return {
                    synced: false,
                    modules: activeModuleSlugs,
                    message: `.env updated but container restart failed: ${restartResult.stderr}`,
                };
            }

            this.logger.log(`[Sync] Container "${containerName}" restarted OK`);
            return {
                synced: true,
                modules: activeModuleSlugs,
                message: `Synced ACTIVE_MODULES=${activeModuleSlugs || '(none)'} and restarted ${containerName}`,
            };
        } catch (err: any) {
            this.logger.error(`[Sync] SSH error: ${err.message}`);
            return { synced: false, modules: activeModuleSlugs, message: `SSH error: ${err.message}` };
        }
    }

    /**
     * Build SSH connection config from a VPS node record.
     * Password extracted from notes field (format: "ssh_password:XXXX").
     */
    private buildSshConfig(node: {
        host: string;
        sshUser: string;
        sshKeyPath: string;
        sshPort: number;
        notes?: string | null;
    }): SshConnectionConfig {
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
}

