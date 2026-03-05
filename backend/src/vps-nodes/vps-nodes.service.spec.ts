import { Test, TestingModule } from '@nestjs/testing';
import { VpsNodesService } from './vps-nodes.service';
import { PrismaService } from '../prisma';
import { SshService } from '../ssh';

describe('VpsNodesService', () => {
    let service: VpsNodesService;
    let prisma: { vpsNode: any };
    let ssh: { exec: jest.Mock; testConnection: jest.Mock };

    const mockNode = {
        id: 'vps-1',
        name: 'VPS-01',
        host: '1.2.3.4',
        sshUser: 'root',
        sshKeyPath: '/root/.ssh/id_rsa',
        sshPort: 22,
        maxMatrices: 10,
        currentLoad: 2,
        status: 'ACTIVE',
        matrices: [
            { id: 'm1', status: 'ACTIVE', deletedAt: null },
            { id: 'm2', status: 'ACTIVE', deletedAt: null },
        ],
    };

    beforeEach(async () => {
        prisma = {
            vpsNode: {
                findMany: jest.fn().mockResolvedValue([mockNode]),
                findUnique: jest.fn().mockResolvedValue(mockNode),
                findFirst: jest.fn().mockResolvedValue({
                    ...mockNode,
                    nextSlotIndex: 3,
                }),
                create: jest.fn().mockResolvedValue(mockNode),
                update: jest.fn().mockResolvedValue(mockNode),
                delete: jest.fn().mockResolvedValue(mockNode),
            },
        };

        ssh = {
            exec: jest.fn().mockResolvedValue({ success: true, stdout: 'ok', stderr: '' }),
            testConnection: jest.fn().mockResolvedValue(true),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VpsNodesService,
                { provide: PrismaService, useValue: prisma },
                { provide: SshService, useValue: ssh },
            ],
        }).compile();

        service = module.get(VpsNodesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('findAll should return all VPS nodes with matrices', async () => {
        const result = await service.findAll();
        expect(result).toEqual([mockNode]);
        expect(prisma.vpsNode.findMany).toHaveBeenCalled();
    });

    it('findOne should return a node by id', async () => {
        const result = await service.findOne('vps-1');
        expect(result.id).toBe('vps-1');
    });

    it('findAvailable should find a node with capacity', async () => {
        const result = await service.findAvailable();
        expect(result).toBeDefined();
        expect(prisma.vpsNode.findMany).toHaveBeenCalled();
    });

    it('getSshConfig should return valid SSH config', () => {
        const config = service.getSshConfig(mockNode as any);
        expect(config).toEqual({
            host: '1.2.3.4',
            username: 'root',
            privateKeyPath: '/root/.ssh/id_rsa',
            port: 22,
        });
    });

    it('testConnection should use SSH testConnection', async () => {
        const result = await service.testConnection('vps-1');
        expect(ssh.testConnection).toHaveBeenCalled();
        expect(result).toEqual({ connected: true });
    });

    it('getStats should return system stats from SSH', async () => {
        ssh.exec.mockResolvedValue({
            success: true,
            stdout: '50% used\n8G total\nup 5 days',
            stderr: '',
        });

        const result = await service.getStats('vps-1');
        expect(ssh.exec).toHaveBeenCalled();
        expect(result).toBeDefined();
    });
});
