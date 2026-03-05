import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SshService, SshConnectionConfig } from '../ssh/ssh.service';
import { CreatePackageDto, UpdatePackageDto } from './dto/package.dto';
import type { Prisma } from '@prisma/client';

@Injectable()
export class PackagesService {
    private readonly logger = new Logger(PackagesService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly ssh: SshService,
    ) { }

    // ── Catalog CRUD ──────────────────────────────────

    async findAll(type?: string) {
        const where: Prisma.PackageCatalogWhereInput = {};
        if (type) {
            where.type = type as any;
        }
        return this.prisma.packageCatalog.findMany({
            where,
            orderBy: { displayName: 'asc' },
            include: {
                installations: {
                    select: { matrixId: true, status: true },
                },
                allowedClients: {
                    include: { client: { select: { id: true, name: true } } },
                },
            },
        });
    }

    async findOne(id: string) {
        const pkg = await this.prisma.packageCatalog.findUnique({
            where: { id },
            include: {
                installations: {
                    include: {
                        matrix: { select: { id: true, slug: true, subdomain: true } },
                    },
                },
            },
        });
        if (!pkg) throw new NotFoundException(`Package ${id} not found`);
        return pkg;
    }

    async create(dto: CreatePackageDto) {
        const existing = await this.prisma.packageCatalog.findUnique({
            where: { name: dto.name },
        });
        if (existing) {
            throw new ConflictException(`Package "${dto.name}" already exists`);
        }

        return this.prisma.packageCatalog.create({
            data: {
                name: dto.name,
                displayName: dto.displayName,
                type: dto.type as any,
                repoUrl: dto.repoUrl,
                version: dto.version ?? '1.0.0',
                description: dto.description,
                icon: dto.icon,
                author: dto.author ?? 'Estrategia Labs',
                category: dto.category,
                isCore: dto.isCore ?? false,
                visibility: (dto.visibility as any) ?? 'PUBLIC',
            },
        });
    }

    async update(id: string, dto: UpdatePackageDto) {
        await this.findOne(id);
        const data: Prisma.PackageCatalogUpdateInput = {};
        if (dto.displayName !== undefined) data.displayName = dto.displayName;
        if (dto.version !== undefined) data.version = dto.version;
        if (dto.description !== undefined) data.description = dto.description;
        if (dto.icon !== undefined) data.icon = dto.icon;
        if (dto.repoUrl !== undefined) data.repoUrl = dto.repoUrl;
        if (dto.author !== undefined) data.author = dto.author;
        if (dto.category !== undefined) data.category = dto.category;
        if (dto.isCore !== undefined) data.isCore = dto.isCore;
        if (dto.status !== undefined) data.status = dto.status as any;
        if (dto.visibility !== undefined) data.visibility = dto.visibility as any;
        return this.prisma.packageCatalog.update({ where: { id }, data });
    }

    async remove(id: string) {
        await this.findOne(id);
        // Remove all installations first
        await this.prisma.matrixPackage.deleteMany({ where: { packageId: id } });
        return this.prisma.packageCatalog.delete({ where: { id } });
    }

    // ── Visibility & Access ───────────────────────────

    /**
     * Return packages available for a given matrix, respecting visibility.
     * PUBLIC packages are always included.
     * PRIVATE packages only if the matrix's client has explicit access.
     */
    async findAvailableForMatrix(matrixId: string) {
        const matrix = await this.prisma.matrixInstance.findUnique({
            where: { id: matrixId },
            select: { clientId: true },
        });
        if (!matrix) throw new NotFoundException(`Matrix ${matrixId} not found`);

        return this.prisma.packageCatalog.findMany({
            where: {
                status: 'PUBLISHED',
                OR: [
                    { visibility: 'PUBLIC' },
                    {
                        visibility: 'PRIVATE',
                        allowedClients: { some: { clientId: matrix.clientId } },
                    },
                ],
            },
            orderBy: { displayName: 'asc' },
        });
    }

    /**
     * Set which clients can access a PRIVATE package.
     * Replaces the entire access list (idempotent).
     */
    async setAccess(packageId: string, clientIds: string[]) {
        await this.findOne(packageId);

        // Delete current access entries
        await this.prisma.packageAccess.deleteMany({ where: { packageId } });

        // Create new entries
        if (clientIds.length > 0) {
            await this.prisma.packageAccess.createMany({
                data: clientIds.map(clientId => ({ packageId, clientId })),
            });
        }

        return this.prisma.packageAccess.findMany({
            where: { packageId },
            include: { client: { select: { id: true, name: true, email: true } } },
        });
    }

    /**
     * Get the access list for a package.
     */
    async getAccess(packageId: string) {
        return this.prisma.packageAccess.findMany({
            where: { packageId },
            include: { client: { select: { id: true, name: true, email: true } } },
        });
    }

    // ── Matrix Package Installations ──────────────────

    async getMatrixPackages(matrixId: string) {
        return this.prisma.matrixPackage.findMany({
            where: { matrixId },
            include: { package: true },
            orderBy: { package: { displayName: 'asc' } },
        });
    }

    async installToMatrix(matrixId: string, packageId: string) {
        // 1. Verify matrix + package exist
        const matrix = await this.prisma.matrixInstance.findUnique({
            where: { id: matrixId },
            include: { vpsNode: true },
        });
        if (!matrix) throw new NotFoundException(`Matrix ${matrixId} not found`);

        const pkg = await this.prisma.packageCatalog.findUnique({
            where: { id: packageId },
        });
        if (!pkg) throw new NotFoundException(`Package ${packageId} not found`);

        // 2. Check if already installed
        const existing = await this.prisma.matrixPackage.findUnique({
            where: { matrixId_packageId: { matrixId, packageId } },
        });
        if (existing) {
            throw new ConflictException(`Package "${pkg.name}" already installed on matrix "${matrix.slug}"`);
        }

        // 3. SSH install: clone + build
        const sshConfig = this.buildSshConfig(matrix.vpsNode);
        const packagesDir = `${matrix.dockerComposeDir}/backend/packages`;
        const installResult = await this.sshInstallPackage(sshConfig, packagesDir, pkg.name, pkg.repoUrl);

        // 4. Record installation
        const installation = await this.prisma.matrixPackage.create({
            data: {
                matrixId,
                packageId,
                version: pkg.version,
                status: installResult.success ? 'installed' : 'error',
            },
            include: { package: true },
        });

        // 5. Restart backend to pick up the new package
        if (installResult.success) {
            await this.restartBackend(sshConfig, matrix.dockerComposeDir, matrix.slug);
        }

        return {
            installation,
            sshOutput: installResult.output,
            success: installResult.success,
        };
    }

    async uninstallFromMatrix(matrixId: string, packageId: string) {
        const matrix = await this.prisma.matrixInstance.findUnique({
            where: { id: matrixId },
            include: { vpsNode: true },
        });
        if (!matrix) throw new NotFoundException(`Matrix ${matrixId} not found`);

        const pkg = await this.prisma.packageCatalog.findUnique({
            where: { id: packageId },
        });
        if (!pkg) throw new NotFoundException(`Package ${packageId} not found`);

        // 1. SSH remove package directory
        const sshConfig = this.buildSshConfig(matrix.vpsNode);
        const packageDir = `${matrix.dockerComposeDir}/backend/packages/${pkg.name}`;

        try {
            await this.ssh.exec(sshConfig, `rm -rf ${packageDir}`);
            this.logger.log(`Removed package dir: ${packageDir}`);
        } catch (err: any) {
            this.logger.warn(`Failed to remove package dir: ${err.message}`);
        }

        // 2. Remove DB record
        await this.prisma.matrixPackage.deleteMany({
            where: { matrixId, packageId },
        });

        // 3. Restart backend
        await this.restartBackend(sshConfig, matrix.dockerComposeDir, matrix.slug);

        return { success: true, message: `Package "${pkg.name}" uninstalled from "${matrix.slug}"` };
    }

    async updateOnMatrix(matrixId: string, packageId: string) {
        const matrix = await this.prisma.matrixInstance.findUnique({
            where: { id: matrixId },
            include: { vpsNode: true },
        });
        if (!matrix) throw new NotFoundException(`Matrix ${matrixId} not found`);

        const pkg = await this.prisma.packageCatalog.findUnique({
            where: { id: packageId },
        });
        if (!pkg) throw new NotFoundException(`Package ${packageId} not found`);

        // Verify it's installed
        const installation = await this.prisma.matrixPackage.findUnique({
            where: { matrixId_packageId: { matrixId, packageId } },
        });
        if (!installation) {
            throw new NotFoundException(`Package "${pkg.name}" is not installed on matrix "${matrix.slug}"`);
        }

        // SSH: git pull + npm install + npm run build
        const sshConfig = this.buildSshConfig(matrix.vpsNode);
        const packageDir = `${matrix.dockerComposeDir}/backend/packages/${pkg.name}`;

        try {
            // Mark as updating
            await this.prisma.matrixPackage.update({
                where: { id: installation.id },
                data: { status: 'updating' },
            });

            const pullResult = await this.ssh.exec(
                sshConfig,
                `cd ${packageDir} && git pull origin main 2>&1`,
            );

            const buildResult = await this.ssh.exec(
                sshConfig,
                `cd ${packageDir} && npm install --production 2>&1 && npm run build 2>&1`,
            );

            const success = pullResult.success && buildResult.success;

            // Update version + status
            await this.prisma.matrixPackage.update({
                where: { id: installation.id },
                data: {
                    status: success ? 'installed' : 'error',
                    version: pkg.version,
                },
            });

            // Restart backend
            if (success) {
                await this.restartBackend(sshConfig, matrix.dockerComposeDir, matrix.slug);
            }

            return {
                success,
                output: `${pullResult.stdout}\n${buildResult.stdout}`,
                message: success
                    ? `Package "${pkg.name}" updated on "${matrix.slug}"`
                    : `Update failed: ${pullResult.stderr || buildResult.stderr}`,
            };
        } catch (err: any) {
            await this.prisma.matrixPackage.update({
                where: { id: installation.id },
                data: { status: 'error' },
            });
            return { success: false, output: '', message: `SSH error: ${err.message}` };
        }
    }

    /**
     * Install all core packages on a matrix. Used during provisioning.
     */
    async installCorePackages(matrixId: string) {
        const corePackages = await this.prisma.packageCatalog.findMany({
            where: { isCore: true, status: 'PUBLISHED' },
        });

        this.logger.log(`[Provisioning] Installing ${corePackages.length} core packages on matrix ${matrixId}`);

        const results: { name: string; success: boolean }[] = [];
        for (const pkg of corePackages) {
            try {
                const result = await this.installToMatrix(matrixId, pkg.id);
                results.push({ name: pkg.name, success: result.success });
            } catch (err: any) {
                // ConflictException = already installed, that's OK
                if (err.status === 409) {
                    results.push({ name: pkg.name, success: true });
                } else {
                    results.push({ name: pkg.name, success: false });
                    this.logger.error(`Failed to install core package "${pkg.name}": ${err.message}`);
                }
            }
        }

        return results;
    }

    // ── SSH Helpers ───────────────────────────────────

    private async sshInstallPackage(
        ssh: SshConnectionConfig,
        packagesDir: string,
        name: string,
        repoUrl: string,
    ): Promise<{ success: boolean; output: string }> {
        try {
            // Ensure packages dir exists
            await this.ssh.exec(ssh, `mkdir -p ${packagesDir}`);

            // Clone repo
            const cloneResult = await this.ssh.exec(
                ssh,
                `cd ${packagesDir} && git clone ${repoUrl} ${name} 2>&1`,
            );
            if (!cloneResult.success) {
                return { success: false, output: `Clone failed: ${cloneResult.stderr}` };
            }

            // npm install + build
            const buildResult = await this.ssh.exec(
                ssh,
                `cd ${packagesDir}/${name} && npm install --production 2>&1 && npm run build 2>&1`,
            );
            if (!buildResult.success) {
                return { success: false, output: `Build failed: ${buildResult.stderr}` };
            }

            this.logger.log(`Package "${name}" installed successfully`);
            return {
                success: true,
                output: `Cloned and built ${name}\n${cloneResult.stdout}\n${buildResult.stdout}`,
            };
        } catch (err: any) {
            this.logger.error(`SSH install error: ${err.message}`);
            return { success: false, output: `SSH error: ${err.message}` };
        }
    }

    private async restartBackend(
        ssh: SshConnectionConfig,
        dockerComposeDir: string,
        slug: string,
    ) {
        try {
            const result = await this.ssh.exec(
                ssh,
                `cd ${dockerComposeDir} && docker compose restart backend 2>&1`,
            );
            if (result.success) {
                this.logger.log(`Backend restarted for "${slug}"`);
            } else {
                this.logger.error(`Backend restart failed: ${result.stderr}`);
            }
            return result;
        } catch (err: any) {
            this.logger.error(`Restart error: ${err.message}`);
        }
    }

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
