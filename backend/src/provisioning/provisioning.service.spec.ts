import { Test, TestingModule } from '@nestjs/testing';
import { ProvisioningService } from './provisioning.service';
import { PrismaService } from '../prisma';
import { SshService } from '../ssh';
import { VpsNodesService } from '../vps-nodes/vps-nodes.service';
import { TemplateGeneratorService } from './template-generator.service';
import { CloudflareService } from './cloudflare.service';
import { SupabaseAdminService } from './supabase-admin.service';
import { PluginCatalogService } from '../plugin-catalog/plugin-catalog.service';
import { ConfigService } from '@nestjs/config';

describe('ProvisioningService', () => {
    let service: ProvisioningService;
    let prisma: any;
    let ssh: any;
    let vpsNodes: any;
    let templates: any;
    let cloudflare: any;
    let supabaseAdmin: any;
    let pluginCatalog: any;

    beforeEach(async () => {
        prisma = {
            matrixInstance: {
                findUnique: jest.fn().mockResolvedValue(null),
                findMany: jest.fn().mockResolvedValue([]),
                create: jest.fn().mockResolvedValue({ id: 'matrix-1', slug: 'test', dbName: 'matriz_test', dbUser: 'user_test', dbPassword: 'pass', n8nUser: 'admin', n8nPassword: 'pass' }),
                update: jest.fn().mockResolvedValue({}),
            },
            vpsNode: { update: jest.fn().mockResolvedValue({}) },
            provisioningEvent: {
                create: jest.fn().mockResolvedValue({ id: 'ev-1' }),
                update: jest.fn().mockResolvedValue({}),
            },
            client: {
                findUnique: jest.fn().mockResolvedValue({ id: 'client-1', email: 'admin@test.com', name: 'Test' }),
            },
        };

        ssh = {
            exec: jest.fn().mockResolvedValue({ success: true, stdout: 'ok', stderr: '' }),
            uploadContent: jest.fn().mockResolvedValue(undefined),
            execMultiple: jest.fn().mockResolvedValue([{ success: true, stdout: 'ok', stderr: '' }]),
        };

        vpsNodes = {
            findOne: jest.fn().mockResolvedValue({ id: 'vps-1', host: '1.2.3.4', sshUser: 'root', sshKeyPath: '/key', sshPort: 22, matrices: [] }),
            findAvailable: jest.fn().mockResolvedValue({ id: 'vps-1', host: '1.2.3.4', sshUser: 'root', sshKeyPath: '/key', sshPort: 22, nextSlotIndex: 1 }),
            getSshConfig: jest.fn().mockReturnValue({ host: '1.2.3.4', username: 'root', privateKeyPath: '/key', port: 22 }),
        };

        templates = {
            calculatePorts: jest.fn().mockReturnValue({ backend: 3001, frontend: 4201, db: 5433, redis: 6380, n8n: 5679, adminer: 8081 }),
            generatePassword: jest.fn().mockReturnValue('secure-password-123'),
            generateEnvFile: jest.fn().mockReturnValue('ENV=content'),
            generateDockerCompose: jest.fn().mockReturnValue('docker-compose: content'),
            generateNginxConfig: jest.fn().mockReturnValue('nginx config'),
        };

        cloudflare = {
            isConfigured: true,
            createARecord: jest.fn().mockResolvedValue({ id: 'dns-1', name: 'test.strategialaboratory.com', content: '1.2.3.4' }),
            deleteARecord: jest.fn().mockResolvedValue(true),
        };

        supabaseAdmin = {
            isConfigured: true,
            createUser: jest.fn().mockResolvedValue({ id: 'supa-user-1', email: 'admin@test.com' }),
            generateAdminPassword: jest.fn().mockReturnValue('admin-pass-123'),
        };

        pluginCatalog = {
            findPublished: jest.fn().mockResolvedValue([
                { id: 'tpl-1', name: 'Echo Agent', version: '1.0.0' },
                { id: 'tpl-2', name: 'Sales Bot', version: '2.0.0' },
            ]),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProvisioningService,
                { provide: PrismaService, useValue: prisma },
                { provide: SshService, useValue: ssh },
                { provide: VpsNodesService, useValue: vpsNodes },
                { provide: TemplateGeneratorService, useValue: templates },
                { provide: CloudflareService, useValue: cloudflare },
                { provide: SupabaseAdminService, useValue: supabaseAdmin },
                { provide: PluginCatalogService, useValue: pluginCatalog },
                { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('test-value') } },
            ],
        }).compile();

        service = module.get(ProvisioningService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('provisionMatrix', () => {
        it('should reject duplicate slugs', async () => {
            prisma.matrixInstance.findUnique.mockResolvedValue({ id: 'existing' });
            await expect(service.provisionMatrix({ clientId: 'c1', slug: 'test' }))
                .rejects.toThrow('already in use');
        });

        it('should execute full pipeline successfully', async () => {
            const result = await service.provisionMatrix({ clientId: 'c1', slug: 'test' });
            expect(result.status).toBe('ACTIVE');
            expect(prisma.matrixInstance.create).toHaveBeenCalled();
            expect(ssh.exec).toHaveBeenCalled();
            expect(cloudflare.createARecord).toHaveBeenCalled();
            expect(supabaseAdmin.createUser).toHaveBeenCalled();
        }, 15000);

        it('should handle step failure gracefully', async () => {
            // PREPARE_VPS makes ~7 SSH calls (update, which*4, compose version, nginx check)
            // Then SELECT_VPS makes 0 SSH calls
            // Then CLONE_REPO: rm -rf + git clone (this is where we fail)
            let callCount = 0;
            ssh.exec.mockImplementation(() => {
                callCount++;
                // Fail on the 9th+ call (git clone step)
                if (callCount >= 9) {
                    return Promise.resolve({ success: false, stdout: '', stderr: 'git clone failed' });
                }
                return Promise.resolve({ success: true, stdout: 'ok', stderr: '' });
            });

            const result = await service.provisionMatrix({ clientId: 'c1', slug: 'test' });
            expect(result.status).toBe('ERROR');
            expect(result.failedStep).toBeDefined();
        });
    });

    describe('suspendMatrix', () => {
        it('should stop containers and update status', async () => {
            prisma.matrixInstance.findUnique.mockResolvedValue({
                id: 'matrix-1',
                dockerComposeDir: '/home/root/matrices/test',
                vpsNode: { id: 'vps-1', host: '1.2.3.4', sshUser: 'root', sshKeyPath: '/key', sshPort: 22 },
            });

            await service.suspendMatrix('matrix-1');
            expect(ssh.exec).toHaveBeenCalledWith(
                expect.any(Object),
                'docker compose stop',
                '/home/root/matrices/test',
            );
        });

        it('should throw for non-existent matrix', async () => {
            prisma.matrixInstance.findUnique.mockResolvedValue(null);
            await expect(service.suspendMatrix('fake')).rejects.toThrow('Matrix not found');
        });
    });

    describe('deleteMatrix', () => {
        it('should cleanup containers, DNS, and decrement VPS load', async () => {
            prisma.matrixInstance.findUnique.mockResolvedValue({
                id: 'matrix-1',
                subdomain: 'test.strategialaboratory.com',
                dockerComposeDir: '/home/root/matrices/test',
                vpsNodeId: 'vps-1',
                vpsNode: { id: 'vps-1', host: '1.2.3.4', sshUser: 'root', sshKeyPath: '/key', sshPort: 22 },
            });

            await service.deleteMatrix('matrix-1');
            expect(ssh.exec).toHaveBeenCalledWith(
                expect.any(Object),
                'docker compose down -v --remove-orphans',
                expect.any(String),
            );
            expect(cloudflare.deleteARecord).toHaveBeenCalledWith('test.strategialaboratory.com');
            expect(prisma.vpsNode.update).toHaveBeenCalledWith(
                expect.objectContaining({ data: { currentLoad: { decrement: 1 } } }),
            );
        });
    });
});
