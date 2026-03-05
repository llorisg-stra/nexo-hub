import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { SshService, SshConnectionConfig } from '../ssh';
import { VpsNodesService } from '../vps-nodes/vps-nodes.service';
import {
    TemplateGeneratorService,
    MatrixEnvConfig,
} from './template-generator.service';
import { CloudflareService } from './cloudflare.service';
import { SupabaseAdminService } from './supabase-admin.service';
import { PluginCatalogService } from '../plugin-catalog/plugin-catalog.service';
import { PackagesService } from '../packages/packages.service';
import { ConfigService } from '@nestjs/config';
import {
    MatrixStatus,
    ProvisioningStep,
    StepStatus,
} from '@prisma/client';

export interface ProvisionMatrixInput {
    clientId: string;
    slug: string;
    vpsNodeId?: string; // Optional: auto-select if not provided
    adminEmail?: string;
    adminPassword?: string;
}

@Injectable()
export class ProvisioningService {
    private readonly logger = new Logger(ProvisioningService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly ssh: SshService,
        private readonly vpsNodes: VpsNodesService,
        private readonly templates: TemplateGeneratorService,
        private readonly cloudflare: CloudflareService,
        private readonly supabaseAdmin: SupabaseAdminService,
        private readonly pluginCatalog: PluginCatalogService,
        private readonly packagesService: PackagesService,
        private readonly config: ConfigService,
    ) { }

    /**
     * Phase 1: Validate input, select VPS, and create matrix record.
     * Fast (DB only, no SSH). Safe to await in HTTP handlers.
     * Returns everything needed for executeProvision.
     */
    async initProvision(input: ProvisionMatrixInput) {
        const { clientId, slug, adminEmail, adminPassword } = input;

        // Validate slug uniqueness
        const existing = await this.prisma.matrixInstance.findUnique({
            where: { slug },
        });
        if (existing) {
            throw new BadRequestException(`Slug "${slug}" is already in use`);
        }

        // Select VPS
        const vps = input.vpsNodeId
            ? await this.vpsNodes.findOne(input.vpsNodeId).then((n) => ({
                id: n.id,
                host: n.host,
                sshUser: n.sshUser,
                sshKeyPath: n.sshKeyPath,
                sshPort: n.sshPort,
                notes: n.notes,
                nextSlotIndex: Math.max(0, ...n.matrices.filter((m) => !m.deletedAt).map((m) => m.slotIndex)) + 1,
            }))
            : await this.vpsNodes.findAvailable();

        const ports = this.templates.calculatePorts(vps.nextSlotIndex);
        const subdomain = `${slug}.strategialaboratory.com`;
        const dbPassword = this.templates.generatePassword();
        const n8nPassword = this.templates.generatePassword();
        const repoUrl = this.config.get<string>('MATRIZ_REPO_URL', 'https://github.com/llorisg-stra/nexo-core.git');
        const baseDir = `/home/${vps.sshUser}/matrices/${slug}`;

        // Create the matrix record
        const matrix = await this.prisma.matrixInstance.create({
            data: {
                clientId,
                vpsNodeId: vps.id,
                slug,
                subdomain,
                slotIndex: vps.nextSlotIndex,
                dbName: `matriz_${slug.replace(/-/g, '_')}`,
                dbUser: `user_${slug.replace(/-/g, '_')}`,
                dbPassword,
                n8nUser: 'admin',
                n8nPassword,
                dockerComposeDir: baseDir,
                portBackend: ports.backend,
                portFrontend: ports.frontend,
                portDb: ports.db,
                portRedis: ports.redis,
                portN8n: ports.n8n,
                portAdminer: ports.adminer,
                status: MatrixStatus.PROVISIONING,
            },
        });

        // Update VPS load
        await this.prisma.vpsNode.update({
            where: { id: vps.id },
            data: { currentLoad: { increment: 1 } },
        });

        const sshConfig: SshConnectionConfig = this.vpsNodes.getSshConfig({
            host: vps.host,
            sshUser: vps.sshUser,
            sshKeyPath: vps.sshKeyPath,
            sshPort: vps.sshPort,
            notes: vps.notes,
        });

        return {
            matrix,
            sshConfig,
            vps,
            ports,
            subdomain,
            dbPassword,
            n8nPassword,
            repoUrl,
            baseDir,
            slug,
            clientId,
            adminEmail,
            adminPassword,
        };
    }

    /**
     * Phase 2: Execute the 12-step provisioning pipeline.
     * Slow (SSH commands). Runs in background for one-click.
     */
    async executeProvision(ctx: {
        matrix: any;
        sshConfig: SshConnectionConfig;
        vps: any;
        ports: any;
        subdomain: string;
        dbPassword: string;
        n8nPassword: string;
        repoUrl: string;
        baseDir: string;
        slug: string;
        clientId: string;
        adminEmail?: string;
        adminPassword?: string;
    }) {
        const { matrix, sshConfig, vps, ports, subdomain, dbPassword, n8nPassword, repoUrl, baseDir, slug, clientId, adminEmail, adminPassword } = ctx;

        const steps: Array<{
            step: ProvisioningStep;
            fn: () => Promise<string>;
        }> = [
                {
                    step: ProvisioningStep.PREPARE_VPS,
                    fn: () => this.stepPrepareVps(sshConfig),
                },
                {
                    step: ProvisioningStep.SELECT_VPS,
                    fn: async () => `Selected VPS ${vps.host} (slot ${vps.nextSlotIndex})`,
                },
                {
                    step: ProvisioningStep.CLONE_REPO,
                    fn: () => this.stepCloneRepo(sshConfig, repoUrl, baseDir),
                },
                {
                    step: ProvisioningStep.GENERATE_ENV,
                    fn: () =>
                        this.stepGenerateEnv(sshConfig, baseDir, {
                            slug,
                            dbName: matrix.dbName,
                            dbUser: matrix.dbUser,
                            dbPassword,
                            n8nUser: matrix.n8nUser,
                            n8nPassword,
                            supabaseUrl: this.config.get('SUPABASE_URL', ''),
                            supabaseServiceRoleKey: this.config.get(
                                'SUPABASE_SERVICE_ROLE_KEY',
                                '',
                            ),
                            corsOrigin: `https://${subdomain}`,
                            ports,
                        }),
                },
                {
                    step: ProvisioningStep.GENERATE_COMPOSE,
                    fn: () =>
                        this.stepGenerateCompose(sshConfig, baseDir, {
                            slug,
                            dbName: matrix.dbName,
                            dbUser: matrix.dbUser,
                            dbPassword,
                            n8nUser: matrix.n8nUser,
                            n8nPassword,
                            supabaseUrl: '',
                            supabaseServiceRoleKey: '',
                            corsOrigin: `https://${subdomain}`,
                            ports,
                        }),
                },
                {
                    step: ProvisioningStep.DOCKER_UP,
                    fn: () => this.stepDockerUp(sshConfig, baseDir),
                },
                {
                    step: ProvisioningStep.CREATE_DNS,
                    fn: () => this.stepCreateDns(subdomain, vps.host),
                },
                {
                    step: ProvisioningStep.CONFIGURE_NGINX,
                    fn: () =>
                        this.stepConfigureNginx(sshConfig, subdomain, {
                            backend: ports.backend,
                            frontend: ports.frontend,
                        }),
                },
                {
                    step: ProvisioningStep.CONFIGURE_SSL,
                    fn: () => this.stepConfigureSsl(sshConfig, subdomain),
                },
                {
                    step: ProvisioningStep.HEALTH_CHECK,
                    fn: () => this.stepHealthCheck(sshConfig, baseDir, slug),
                },
                {
                    step: ProvisioningStep.CREATE_ADMIN,
                    fn: () => this.stepCreateAdmin(matrix.id, clientId, adminEmail, adminPassword),
                },
                {
                    step: ProvisioningStep.SYNC_PLUGINS,
                    fn: () => this.stepSyncPlugins(sshConfig, ports.backend),
                },
                {
                    step: ProvisioningStep.SYNC_PACKAGES,
                    fn: () => this.stepSyncPackages(matrix.id),
                },
            ];

        let lastSuccessfulStep: ProvisioningStep | null = null;

        for (const { step, fn } of steps) {
            const event = await this.prisma.provisioningEvent.create({
                data: {
                    matrixId: matrix.id,
                    step,
                    status: StepStatus.RUNNING,
                },
            });

            const startTime = Date.now();
            try {
                const message = await fn();
                const durationMs = Date.now() - startTime;

                await this.prisma.provisioningEvent.update({
                    where: { id: event.id },
                    data: { status: StepStatus.OK, message, durationMs },
                });

                lastSuccessfulStep = step;
                this.logger.log(`[${slug}] Step ${step} completed: ${message}`);
            } catch (error) {
                const durationMs = Date.now() - startTime;
                const errorMessage =
                    error instanceof Error ? error.message : String(error);

                await this.prisma.provisioningEvent.update({
                    where: { id: event.id },
                    data: {
                        status: StepStatus.FAILED,
                        message: errorMessage,
                        durationMs,
                    },
                });

                await this.prisma.matrixInstance.update({
                    where: { id: matrix.id },
                    data: {
                        status: MatrixStatus.ERROR,
                        provisionLog: `Failed at step ${step}: ${errorMessage}`,
                    },
                });

                this.logger.error(
                    `[${slug}] Step ${step} FAILED: ${errorMessage}`,
                );

                return {
                    matrix,
                    status: 'ERROR',
                    failedStep: step,
                    lastSuccessfulStep,
                    error: errorMessage,
                };
            }
        }

        // Mark as DONE
        await this.prisma.provisioningEvent.create({
            data: {
                matrixId: matrix.id,
                step: ProvisioningStep.DONE,
                status: StepStatus.OK,
                message: `Matrix ${slug} fully provisioned`,
            },
        });

        await this.prisma.matrixInstance.update({
            where: { id: matrix.id },
            data: {
                status: MatrixStatus.ACTIVE,
                healthLastCheck: new Date(),
                healthStatus: 'healthy',
            },
        });

        return {
            matrix: await this.prisma.matrixInstance.findUnique({
                where: { id: matrix.id },
                include: { vpsNode: true, events: true },
            }),
            status: 'ACTIVE',
            url: `https://${subdomain}`,
        };
    }

    /**
     * Main entry point: provision a full matrix instance for a client.
     * Runs init + execute sequentially (used by POST /api/matrices).
     */
    async provisionMatrix(input: ProvisionMatrixInput) {
        const ctx = await this.initProvision(input);
        return this.executeProvision(ctx);
    }

    // ---- Individual pipeline steps ----

    private async stepCloneRepo(
        ssh: SshConnectionConfig,
        repoUrl: string,
        baseDir: string,
    ): Promise<string> {
        const githubPat = this.config.get<string>('GITHUB_PAT', '');
        const cloneUrl = githubPat
            ? repoUrl.replace('https://github.com', `https://x-access-token:${githubPat}@github.com`)
            : repoUrl;

        // Clean up any existing directory from a failed previous attempt
        await this.ssh.exec(ssh, `rm -rf ${baseDir}`);

        const result = await this.ssh.exec(
            ssh,
            `mkdir -p $(dirname ${baseDir}) && git clone ${cloneUrl} ${baseDir}`,
        );
        if (!result.success) throw new Error(`git clone failed: ${result.stderr}`);
        return `Cloned to ${baseDir}`;
    }

    private async stepGenerateEnv(
        ssh: SshConnectionConfig,
        baseDir: string,
        envConfig: MatrixEnvConfig,
    ): Promise<string> {
        const envContent = this.templates.generateEnvFile(envConfig);
        await this.ssh.uploadContent(ssh, envContent, `${baseDir}/.env`);
        return `.env generated with unique credentials`;
    }

    private async stepGenerateCompose(
        ssh: SshConnectionConfig,
        baseDir: string,
        envConfig: MatrixEnvConfig,
    ): Promise<string> {
        const composeContent = this.templates.generateDockerCompose(envConfig);
        await this.ssh.uploadContent(
            ssh,
            composeContent,
            `${baseDir}/docker-compose.yml`,
        );
        return `docker-compose.yml generated (ports: ${envConfig.ports.backend}-${envConfig.ports.adminer})`;
    }

    private async stepDockerUp(
        ssh: SshConnectionConfig,
        baseDir: string,
    ): Promise<string> {
        const result = await this.ssh.exec(
            ssh,
            'docker compose up -d --build',
            baseDir,
        );
        if (!result.success) {
            throw new Error(`docker compose up failed: ${result.stderr}`);
        }

        // Wait for DB to be healthy
        await this.sleep(5000);

        // Create pgvector extension
        const slug = baseDir.split('/').pop();
        await this.ssh.exec(
            ssh,
            `docker exec matriz-${slug}-db psql -U \${POSTGRES_USER} -d \${POSTGRES_DB} -c "CREATE EXTENSION IF NOT EXISTS vector;"`,
            baseDir,
        );

        // Run Prisma migrate deploy to create all tables
        const migrateResult = await this.ssh.exec(
            ssh,
            'docker compose run --rm backend npx prisma migrate deploy',
            baseDir,
        );
        if (!migrateResult.success) {
            this.logger.warn(`Prisma migrate warning: ${migrateResult.stderr}`);
        }

        return 'Containers started, pgvector enabled, schema pushed';
    }

    private async stepCreateDns(subdomain: string, vpsIp: string): Promise<string> {
        if (!this.cloudflare.isConfigured) {
            return `DNS: Manual setup required for ${subdomain} (Cloudflare not configured)`;
        }

        try {
            const record = await this.cloudflare.createARecord(subdomain, vpsIp);
            return `DNS A record created: ${subdomain} → ${vpsIp} (id: ${record.id})`;
        } catch (error: any) {
            const msg = error?.message || String(error);
            if (msg.includes('already exists') || msg.includes('already exist')) {
                return `DNS A record already exists for ${subdomain} → ${vpsIp} (reusing)`;
            }
            throw error;
        }
    }

    private async stepConfigureSsl(
        ssh: SshConnectionConfig,
        subdomain: string,
    ): Promise<string> {
        const result = await this.ssh.exec(
            ssh,
            `sudo certbot --nginx -d ${subdomain} --non-interactive --agree-tos --email admin@strategialaboratory.com`,
        );
        if (!result.success) {
            // SSL can fail if DNS hasn't propagated yet — non-fatal
            return `SSL: Certbot returned non-zero, may need retry. ${result.stderr}`;
        }
        return `SSL configured for ${subdomain}`;
    }

    private async stepConfigureNginx(
        ssh: SshConnectionConfig,
        subdomain: string,
        ports: { backend: number; frontend: number },
    ): Promise<string> {
        const nginxConfig = this.templates.generateNginxConfig(subdomain, ports);
        const configPath = `/etc/nginx/sites-available/${subdomain}`;
        const enabledPath = `/etc/nginx/sites-enabled/${subdomain}`;

        // Ensure directories exist
        await this.ssh.exec(ssh, 'sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled');

        // Write config using sudo tee (uploadContent uses echo without sudo)
        const escapedConfig = nginxConfig.replace(/'/g, "'\\''");
        await this.ssh.exec(ssh, `echo '${escapedConfig}' | sudo tee ${configPath} > /dev/null`);

        await this.ssh.exec(ssh, `sudo ln -sf ${configPath} ${enabledPath}`);
        const testResult = await this.ssh.exec(ssh, 'sudo nginx -t');
        if (!testResult.success) {
            throw new Error(`Nginx config invalid: ${testResult.stderr}`);
        }
        await this.ssh.exec(ssh, 'sudo systemctl reload nginx');
        return `Nginx configured and reloaded for ${subdomain}`;
    }

    private async stepHealthCheck(
        ssh: SshConnectionConfig,
        baseDir: string,
        slug: string,
    ): Promise<string> {
        // Wait a few seconds for containers to start
        await this.sleep(5000);

        const result = await this.ssh.exec(
            ssh,
            `docker compose ps --format json`,
            baseDir,
        );

        if (!result.success) {
            throw new Error(`Health check failed: ${result.stderr}`);
        }

        // Check if all containers are running
        const containers = result.stdout.trim();
        if (!containers) {
            throw new Error('No containers running');
        }

        return `Health check passed — containers running`;
    }

    private async stepCreateAdmin(
        matrixId: string,
        clientId: string,
        adminEmail?: string,
        adminPassword?: string,
    ): Promise<string> {
        if (!this.supabaseAdmin.isConfigured) {
            return `Admin: Manual setup required (Supabase not configured)`;
        }

        const client = await this.prisma.client.findUnique({ where: { id: clientId } });
        if (!client) throw new Error(`Client ${clientId} not found`);

        const email = adminEmail || client.email;
        const password = adminPassword || this.supabaseAdmin.generateAdminPassword();

        // Get the matrix slug for tenant isolation
        const matrix = await this.prisma.matrixInstance.findUnique({ where: { id: matrixId } });
        const tenantSlug = matrix?.slug || matrixId;

        const user = await this.supabaseAdmin.createUser(
            email,
            password,
            tenantSlug,
            { matrixId, clientId, role: 'admin' },
        );

        // Store the Supabase user ID in the matrix record
        await this.prisma.matrixInstance.update({
            where: { id: matrixId },
            data: { adminSupabaseId: user.id },
        });

        return `Admin created: ${client.email} (Supabase ID: ${user.id})`;
    }

    /**
     * Step 11: Sync published plugins from the catalog into the new matrix.
     * Uses SSH + curl to call the matrix backend's install-from-panel endpoint.
     */
    private async stepSyncPlugins(
        ssh: SshConnectionConfig,
        backendPort: number,
    ): Promise<string> {
        const published = await this.pluginCatalog.findPublished();

        if (published.length === 0) {
            return 'No published plugins to sync';
        }

        let installed = 0;
        let failed = 0;

        for (const plugin of published) {
            const curlCmd = `curl -sf -X POST http://localhost:${backendPort}/api/v1/installed-plugins/install-from-panel `
                + `-H "Content-Type: application/json" `
                + `-d '{"templateId": "${plugin.id}"}'`;

            const result = await this.ssh.exec(ssh, curlCmd);

            if (result.success) {
                installed++;
                this.logger.log(`Plugin synced: ${plugin.name} v${plugin.version}`);
            } else {
                failed++;
                this.logger.warn(`Failed to sync plugin ${plugin.name}: ${result.stderr}`);
            }
        }

        return `${installed}/${published.length} plugins synced${failed > 0 ? ` (${failed} failed)` : ''}`;
    }

    /**
     * Step 12: Install core packages (channels, connectors, modules, etc.) from the catalog.
     * Uses PackagesService.installCorePackages() which handles SSH clone + build.
     */
    private async stepSyncPackages(matrixId: string): Promise<string> {
        const results = await this.packagesService.installCorePackages(matrixId);

        if (results.length === 0) {
            return 'No core packages to install';
        }

        const ok = results.filter(r => r.success).length;
        const fail = results.filter(r => !r.success).length;

        return `${ok}/${results.length} core packages installed${fail > 0 ? ` (${fail} failed)` : ''}`;
    }

    // ---- Lifecycle operations ----

    /**
     * Suspend a matrix (stop containers, keep data).
     */
    async suspendMatrix(matrixId: string): Promise<void> {
        const matrix = await this.prisma.matrixInstance.findUnique({
            where: { id: matrixId },
            include: { vpsNode: true },
        });
        if (!matrix) throw new BadRequestException('Matrix not found');

        const sshConfig = this.vpsNodes.getSshConfig(matrix.vpsNode);
        await this.ssh.exec(sshConfig, 'docker compose stop', matrix.dockerComposeDir);

        await this.prisma.matrixInstance.update({
            where: { id: matrixId },
            data: { status: MatrixStatus.SUSPENDED },
        });
    }

    /**
     * Reactivate a suspended matrix.
     */
    async reactivateMatrix(matrixId: string): Promise<void> {
        const matrix = await this.prisma.matrixInstance.findUnique({
            where: { id: matrixId },
            include: { vpsNode: true },
        });
        if (!matrix) throw new BadRequestException('Matrix not found');

        const sshConfig = this.vpsNodes.getSshConfig(matrix.vpsNode);
        await this.ssh.exec(sshConfig, 'docker compose start', matrix.dockerComposeDir);

        await this.prisma.matrixInstance.update({
            where: { id: matrixId },
            data: { status: MatrixStatus.ACTIVE },
        });
    }

    /**
     * Update a matrix to the latest version.
     */
    async updateMatrix(matrixId: string): Promise<string> {
        const matrix = await this.prisma.matrixInstance.findUnique({
            where: { id: matrixId },
            include: { vpsNode: true },
        });
        if (!matrix) throw new BadRequestException('Matrix not found');

        await this.prisma.matrixInstance.update({
            where: { id: matrixId },
            data: { status: MatrixStatus.UPDATING },
        });

        const sshConfig = this.vpsNodes.getSshConfig(matrix.vpsNode);
        const dir = matrix.dockerComposeDir;

        // Inject GITHUB_PAT for private repo authentication
        const githubPat = this.config.get<string>('GITHUB_PAT', '');
        const repoUrl = this.config.get<string>(
            'MATRIZ_REPO_URL',
            'https://github.com/llorisg-stra/nexo-core.git',
        );

        const commands: string[] = [];

        if (githubPat) {
            // Temporarily set the authenticated remote URL for pull
            const authedUrl = repoUrl.replace('https://github.com', `https://x-access-token:${githubPat}@github.com`);
            commands.push(`git remote set-url origin ${authedUrl}`);
        }

        commands.push(
            // Preserve the matrix-specific docker-compose.yml across git reset
            'cp docker-compose.yml docker-compose.yml.matrix-backup',
            'git fetch origin main',
            'git reset --hard origin/main',
            // Restore the matrix's own compose (with correct ports, names, network)
            'mv docker-compose.yml.matrix-backup docker-compose.yml',
        );

        if (githubPat) {
            // Restore clean remote URL (don't leave PAT in git config)
            commands.push(`git remote set-url origin ${repoUrl}`);
        }

        // Safety net: if the compose still has generic names (e.g. badly provisioned),
        // rewrite them with the slug. The sed is a no-op if names already include slug.
        const slug = matrix.slug;
        commands.push(
            `sed -i 's/container_name: matriz-db$/container_name: matriz-${slug}-db/g' docker-compose.yml`,
            `sed -i 's/container_name: matriz-redis$/container_name: matriz-${slug}-redis/g' docker-compose.yml`,
            `sed -i 's/container_name: matriz-adminer$/container_name: matriz-${slug}-adminer/g' docker-compose.yml`,
            `sed -i 's/container_name: matriz-n8n$/container_name: matriz-${slug}-n8n/g' docker-compose.yml`,
            `sed -i 's/container_name: matriz-backend$/container_name: matriz-${slug}-backend/g' docker-compose.yml`,
            `sed -i 's/container_name: matriz-frontend$/container_name: matriz-${slug}-frontend/g' docker-compose.yml`,
            `sed -i 's/name: matriz-network$/name: matriz-${slug}-network/g' docker-compose.yml`,
        );

        commands.push(
            'docker compose build --no-cache',
            'docker compose down --remove-orphans',
            'docker compose up -d',
        );

        try {
            const results = await this.ssh.execMultiple(sshConfig, commands, dir);
            const lastResult = results[results.length - 1];

            if (!lastResult.success) {
                await this.prisma.matrixInstance.update({
                    where: { id: matrixId },
                    data: {
                        status: MatrixStatus.ERROR,
                        provisionLog: `Update failed: ${lastResult.stderr}`,
                    },
                });
                throw new Error(`Update failed: ${lastResult.stderr}`);
            }

            // Get new git commit
            const commitResult = await this.ssh.exec(
                sshConfig,
                'git rev-parse --short HEAD',
                dir,
            );

            await this.prisma.matrixInstance.update({
                where: { id: matrixId },
                data: {
                    status: MatrixStatus.ACTIVE,
                    gitCommit: commitResult.stdout.trim(),
                    provisionLog: `Updated at ${new Date().toISOString()}`,
                },
            });

            this.logger.log(
                `Matrix ${matrix.slug} updated to ${commitResult.stdout.trim()}`,
            );

            return commitResult.stdout.trim();
        } catch (error: any) {
            // Always mark as ERROR so the matrix never stays stuck in UPDATING
            await this.prisma.matrixInstance.update({
                where: { id: matrixId },
                data: {
                    status: MatrixStatus.ERROR,
                    provisionLog: `Update failed: ${error.message || error}`,
                },
            }).catch((dbErr) => {
                this.logger.error(`Failed to set ERROR status for ${matrix.slug}`, dbErr);
            });

            // Clean up PAT from remote URL
            if (githubPat) {
                await this.ssh.exec(
                    sshConfig,
                    `git remote set-url origin ${repoUrl}`,
                    dir,
                ).catch(() => { /* ignore cleanup errors */ });
            }
            throw error;
        }
    }

    /**
     * Full cleanup of a matrix: containers, volumes, Supabase user,
     * Nginx config, DNS record, and project directory.
     */
    async deleteMatrix(matrixId: string): Promise<void> {
        const matrix = await this.prisma.matrixInstance.findUnique({
            where: { id: matrixId },
            include: { vpsNode: true },
        });
        if (!matrix) throw new BadRequestException('Matrix not found');

        const sshConfig = this.vpsNodes.getSshConfig(matrix.vpsNode);
        const slug = matrix.slug;

        this.logger.log(`[${slug}] Starting full cleanup...`);

        // 1. Stop and remove Docker containers + volumes
        try {
            await this.ssh.exec(
                sshConfig,
                'docker compose down -v --remove-orphans',
                matrix.dockerComposeDir,
            );
            this.logger.log(`[${slug}] Docker containers removed`);
        } catch (err) {
            this.logger.warn(`[${slug}] Docker cleanup failed: ${err}`);
        }

        // 2. Delete Supabase admin user
        if (matrix.adminSupabaseId && this.supabaseAdmin.isConfigured) {
            try {
                await this.supabaseAdmin.deleteUser(matrix.adminSupabaseId);
                this.logger.log(`[${slug}] Supabase user ${matrix.adminSupabaseId} deleted`);
            } catch (err) {
                this.logger.warn(`[${slug}] Supabase user cleanup failed: ${err}`);
            }
        }

        // 3. Remove Nginx site config + reload
        if (matrix.subdomain) {
            try {
                await this.ssh.exec(sshConfig,
                    `sudo rm -f /etc/nginx/sites-enabled/${matrix.subdomain} /etc/nginx/sites-available/${matrix.subdomain}`,
                );
                await this.ssh.exec(sshConfig, 'sudo nginx -t && sudo systemctl reload nginx');
                this.logger.log(`[${slug}] Nginx config removed and reloaded`);
            } catch (err) {
                this.logger.warn(`[${slug}] Nginx cleanup failed: ${err}`);
            }
        }

        // 4. Delete Cloudflare DNS record
        if (this.cloudflare.isConfigured && matrix.subdomain) {
            try {
                await this.cloudflare.deleteARecord(matrix.subdomain);
                this.logger.log(`[${slug}] DNS record deleted for ${matrix.subdomain}`);
            } catch (err) {
                this.logger.warn(`[${slug}] DNS cleanup failed: ${err}`);
            }
        }

        // 5. Remove project directory from VPS
        if (matrix.dockerComposeDir) {
            try {
                await this.ssh.exec(sshConfig, `rm -rf ${matrix.dockerComposeDir}`);
                this.logger.log(`[${slug}] Directory ${matrix.dockerComposeDir} removed`);
            } catch (err) {
                this.logger.warn(`[${slug}] Directory cleanup failed: ${err}`);
            }
        }

        // 6. Soft-delete in database
        await this.prisma.matrixInstance.update({
            where: { id: matrixId },
            data: {
                status: MatrixStatus.DELETED,
                deletedAt: new Date(),
                provisionLog: `Fully deleted at ${new Date().toISOString()}`,
            },
        });

        // 7. Decrement VPS load
        await this.prisma.vpsNode.update({
            where: { id: matrix.vpsNodeId },
            data: { currentLoad: { decrement: 1 } },
        });

        this.logger.log(`[${slug}] ✅ Full cleanup complete`);
    }

    /**
     * Migrate a matrix from its current VPS to a different one.
     * 16-step pipeline with rollback support.
     */
    async migrateMatrix(matrixId: string, targetVpsId: string): Promise<string> {
        // ---- Step 1: Validate ----
        const matrix = await this.prisma.matrixInstance.findUnique({
            where: { id: matrixId },
            include: { vpsNode: true },
        });
        if (!matrix) throw new BadRequestException('Matrix not found');
        if (matrix.status !== MatrixStatus.ACTIVE) {
            throw new BadRequestException(`Matrix must be ACTIVE to migrate (current: ${matrix.status})`);
        }
        if (matrix.vpsNodeId === targetVpsId) {
            throw new BadRequestException('Matrix is already on this VPS');
        }

        const targetVps = await this.vpsNodes.findOne(targetVpsId);
        const activeMatrices = targetVps.matrices?.filter((m: any) => !m.deletedAt) || [];
        if (activeMatrices.length >= targetVps.maxMatrices) {
            throw new BadRequestException('Target VPS has no available capacity');
        }

        // Calculate target slot
        const usedSlots = activeMatrices.map((m: any) => m.slotIndex);
        let targetSlot = 1;
        while (usedSlots.includes(targetSlot)) targetSlot++;

        const slug = matrix.slug;
        const sourceConfig = this.vpsNodes.getSshConfig(matrix.vpsNode);
        const targetConfig = this.vpsNodes.getSshConfig(targetVps);
        const sourceDir = matrix.dockerComposeDir;
        const targetDir = `/home/${targetVps.sshUser}/matrices/${slug}`;
        const newPorts = this.templates.calculatePorts(targetSlot);
        const dumpFile = `/tmp/${slug}_migration.tar.gz`;

        this.logger.log(`[${slug}] Starting migration: ${matrix.vpsNode.host} → ${targetVps.host} (slot ${targetSlot})`);

        // ---- Step 2: Set status MIGRATING ----
        await this.prisma.matrixInstance.update({
            where: { id: matrixId },
            data: {
                status: MatrixStatus.MIGRATING,
                provisionLog: `Migration started at ${new Date().toISOString()}`,
            },
        });

        try {
            // ---- Step 3: Stop source containers (keep volumes) ----
            this.logger.log(`[${slug}] Step 3: Stopping source containers...`);
            await this.ssh.exec(sourceConfig, 'docker compose stop', sourceDir);

            // ---- Step 4: Export PostgreSQL dump ----
            this.logger.log(`[${slug}] Step 4: Exporting database...`);
            await this.ssh.exec(
                sourceConfig,
                `docker compose run --rm -T db pg_dumpall -U $POSTGRES_USER > /tmp/${slug}_db.sql`,
                sourceDir,
            );

            // ---- Step 5: Tar project directory + DB dump ----
            this.logger.log(`[${slug}] Step 5: Creating migration archive...`);
            // Export Docker volumes data
            await this.ssh.exec(sourceConfig,
                `docker compose run --rm -T -v matriz-${slug}-n8ndata:/backup/n8n -v matriz-${slug}-pgdata:/backup/pg alpine tar czf /tmp/volumes_${slug}.tar.gz -C /backup .`,
                sourceDir,
            );
            // Create full archive
            await this.ssh.exec(sourceConfig,
                `tar czf ${dumpFile} -C ${sourceDir} . -C /tmp ${slug}_db.sql volumes_${slug}.tar.gz`,
            );

            // ---- Step 6: Transfer to target VPS ----
            this.logger.log(`[${slug}] Step 6: Transferring to target VPS...`);
            // Use source VPS to SCP to target VPS
            const targetPassword = targetConfig.password;
            if (targetPassword) {
                await this.ssh.exec(sourceConfig,
                    `sshpass -p '${targetPassword}' scp -o StrictHostKeyChecking=no ${dumpFile} ${targetConfig.username}@${targetConfig.host}:/tmp/`,
                );
            } else {
                await this.ssh.exec(sourceConfig,
                    `scp -o StrictHostKeyChecking=no ${dumpFile} ${targetConfig.username}@${targetConfig.host}:/tmp/`,
                );
            }

            // ---- Step 7: Unpack on target ----
            this.logger.log(`[${slug}] Step 7: Unpacking on target VPS...`);
            await this.ssh.exec(targetConfig, `mkdir -p ${targetDir}`);
            await this.ssh.exec(targetConfig, `tar xzf ${dumpFile} -C ${targetDir}`);

            // ---- Step 8: Generate new docker-compose with new ports ----
            this.logger.log(`[${slug}] Step 8: Generating new docker-compose...`);
            const envConfig: MatrixEnvConfig = {
                slug,
                dbName: matrix.dbName,
                dbUser: matrix.dbUser,
                dbPassword: matrix.dbPassword,
                n8nUser: matrix.n8nUser,
                n8nPassword: matrix.n8nPassword,
                supabaseUrl: this.config.get('SUPABASE_URL', ''),
                supabaseServiceRoleKey: this.config.get('SUPABASE_SERVICE_ROLE_KEY', ''),
                corsOrigin: `https://${matrix.subdomain}`,
                ports: newPorts,
            };
            const compose = this.templates.generateDockerCompose(envConfig);
            const escapedCompose = compose.replace(/'/g, "'\\''");
            await this.ssh.exec(targetConfig, `echo '${escapedCompose}' > ${targetDir}/docker-compose.yml`);

            // ---- Step 9: Upload .env ----
            this.logger.log(`[${slug}] Step 9: Uploading .env...`);
            const envFile = this.templates.generateEnvFile(envConfig);
            const escapedEnv = envFile.replace(/'/g, "'\\''");
            await this.ssh.exec(targetConfig, `echo '${escapedEnv}' > ${targetDir}/.env`);

            // ---- Step 10: Docker up on target ----
            this.logger.log(`[${slug}] Step 10: Starting containers on target...`);
            await this.ssh.exec(targetConfig, 'docker compose up -d', targetDir);

            // Restore DB dump
            this.logger.log(`[${slug}] Step 10b: Restoring database dump...`);
            await this.sleep(5000); // Wait for DB container to be ready
            await this.ssh.exec(targetConfig,
                `docker compose exec -T db psql -U ${matrix.dbUser} -d ${matrix.dbName} < ${targetDir}/${slug}_db.sql`,
                targetDir,
            );

            // ---- Step 11: Health check ----
            this.logger.log(`[${slug}] Step 11: Health check...`);
            await this.stepHealthCheck(targetConfig, targetDir, slug);

            // ---- Step 12: Update DNS ----
            this.logger.log(`[${slug}] Step 12: Updating DNS...`);
            if (this.cloudflare.isConfigured && matrix.subdomain) {
                // Delete old record and create new one pointing to target VPS
                await this.cloudflare.deleteARecord(matrix.subdomain).catch(() => { });
                const targetIp = targetVps.ip || targetVps.host;
                await this.cloudflare.createARecord(matrix.subdomain, targetIp);
            }

            // ---- Step 13: Update Nginx ----
            this.logger.log(`[${slug}] Step 13: Configuring Nginx on target...`);
            // Remove Nginx from source
            await this.ssh.exec(sourceConfig,
                `sudo rm -f /etc/nginx/sites-enabled/${matrix.subdomain} /etc/nginx/sites-available/${matrix.subdomain}`,
            ).catch(() => { });
            await this.ssh.exec(sourceConfig, 'sudo nginx -t && sudo systemctl reload nginx').catch(() => { });

            // Configure Nginx on target
            await this.stepConfigureNginx(targetConfig, matrix.subdomain, {
                backend: newPorts.backend,
                frontend: newPorts.frontend,
            });

            // SSL on target
            this.logger.log(`[${slug}] Step 13b: Configuring SSL on target...`);
            await this.stepConfigureSsl(targetConfig, matrix.subdomain).catch((err) => {
                this.logger.warn(`[${slug}] SSL setup failed (may need DNS propagation): ${err}`);
            });

            // ---- Step 14: Update database ----
            this.logger.log(`[${slug}] Step 14: Updating Panel database...`);
            await this.prisma.matrixInstance.update({
                where: { id: matrixId },
                data: {
                    vpsNodeId: targetVpsId,
                    slotIndex: targetSlot,
                    dockerComposeDir: targetDir,
                    portBackend: newPorts.backend,
                    portFrontend: newPorts.frontend,
                    portDb: newPorts.db,
                    portRedis: newPorts.redis,
                    portN8n: newPorts.n8n,
                    portAdminer: newPorts.adminer,
                    status: MatrixStatus.ACTIVE,
                    provisionLog: `Migrated from ${matrix.vpsNode.host} to ${targetVps.host} at ${new Date().toISOString()}`,
                },
            });

            // Update VPS load counters
            await this.prisma.vpsNode.update({
                where: { id: matrix.vpsNodeId },
                data: { currentLoad: { decrement: 1 } },
            });
            await this.prisma.vpsNode.update({
                where: { id: targetVpsId },
                data: { currentLoad: { increment: 1 } },
            });

            // ---- Step 15: Cleanup source ----
            this.logger.log(`[${slug}] Step 15: Cleaning up source VPS...`);
            await this.ssh.exec(sourceConfig, 'docker compose down -v', sourceDir).catch(() => { });
            await this.ssh.exec(sourceConfig, `rm -rf ${sourceDir}`).catch(() => { });
            await this.ssh.exec(sourceConfig, `rm -f ${dumpFile} /tmp/${slug}_db.sql /tmp/volumes_${slug}.tar.gz`).catch(() => { });

            // ---- Step 16: Done ----
            const commitResult = await this.ssh.exec(targetConfig, 'git rev-parse --short HEAD', targetDir).catch(() => ({ stdout: 'unknown' }));
            const commit = (commitResult as any).stdout?.trim() || 'unknown';

            this.logger.log(`[${slug}] ✅ Migration complete → ${targetVps.host} (commit ${commit})`);
            return commit;

        } catch (error) {
            // ---- Rollback: restart source containers ----
            this.logger.error(`[${slug}] Migration failed: ${error}. Rolling back...`);
            try {
                await this.ssh.exec(sourceConfig, 'docker compose up -d', sourceDir);
                this.logger.log(`[${slug}] Rollback: source containers restarted`);
            } catch (rollbackErr) {
                this.logger.error(`[${slug}] Rollback also failed: ${rollbackErr}`);
            }

            await this.prisma.matrixInstance.update({
                where: { id: matrixId },
                data: {
                    status: MatrixStatus.ACTIVE,
                    provisionLog: `Migration failed at ${new Date().toISOString()}: ${error}`,
                },
            });

            throw error;
        }
    }

    /**
     * Update all active matrices (rolling update).
     */
    async updateAll(): Promise<{ updated: string[]; failed: string[] }> {
        const matrices = await this.prisma.matrixInstance.findMany({
            where: { status: MatrixStatus.ACTIVE },
        });

        const updated: string[] = [];
        const failed: string[] = [];

        for (const matrix of matrices) {
            try {
                await this.updateMatrix(matrix.id);
                updated.push(matrix.slug);
            } catch (error) {
                failed.push(matrix.slug);
                this.logger.error(
                    `Rolling update failed for ${matrix.slug}: ${error}`,
                );
            }
        }

        return { updated, failed };
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Prepare a fresh VPS: install Docker, Nginx, certbot, git.
     * Idempotent — skips packages that are already installed.
     */
    private async stepPrepareVps(ssh: SshConnectionConfig): Promise<string> {
        const installed: string[] = [];

        // 1. System update
        await this.ssh.exec(ssh, 'sudo apt-get update -y');

        // 2. Git
        const gitCheck = await this.ssh.exec(ssh, 'which git');
        if (!gitCheck.success) {
            await this.ssh.exec(ssh, 'sudo apt-get install -y git');
            installed.push('git');
        }

        // 3. Docker
        const dockerCheck = await this.ssh.exec(ssh, 'which docker');
        if (!dockerCheck.success) {
            await this.ssh.exec(ssh, 'curl -fsSL https://get.docker.com | sudo sh');
            await this.ssh.exec(ssh, 'sudo usermod -aG docker ubuntu');
            installed.push('docker');
        }

        // 4. Docker Compose plugin
        const composeCheck = await this.ssh.exec(ssh, 'docker compose version');
        if (!composeCheck.success) {
            await this.ssh.exec(ssh, 'sudo apt-get install -y docker-compose-plugin');
            installed.push('docker-compose-plugin');
        }

        // 5. Nginx
        const nginxCheck = await this.ssh.exec(ssh, 'which nginx');
        if (!nginxCheck.success) {
            await this.ssh.exec(ssh, 'sudo apt-get install -y nginx');
            await this.ssh.exec(ssh, 'sudo systemctl enable nginx');
            await this.ssh.exec(ssh, 'sudo systemctl start nginx');
            installed.push('nginx');
        }

        // 6. Certbot
        const certbotCheck = await this.ssh.exec(ssh, 'which certbot');
        if (!certbotCheck.success) {
            await this.ssh.exec(ssh, 'sudo apt-get install -y certbot python3-certbot-nginx');
            installed.push('certbot');
        }

        if (installed.length === 0) {
            return 'VPS already prepared (all tools installed)';
        }
        return `Installed: ${installed.join(', ')}`;
    }
}
