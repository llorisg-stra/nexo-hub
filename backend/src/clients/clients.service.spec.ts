import { Test, TestingModule } from '@nestjs/testing';
import { ClientsService } from './clients.service';
import { PrismaService } from '../prisma';
import { SupabaseAdminService } from '../provisioning/supabase-admin.service';

describe('ClientsService', () => {
    let service: ClientsService;
    let prisma: { client: any };

    const mockClient = {
        id: 'client-1',
        name: 'Test Client',
        email: 'test@test.com',
        company: 'TestCo',
        plan: 'pro',
        status: 'ACTIVE',
        notes: '',
        stripeCustomerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        prisma = {
            client: {
                findMany: jest.fn().mockResolvedValue([mockClient]),
                findUnique: jest.fn().mockResolvedValue(mockClient),
                create: jest.fn().mockResolvedValue(mockClient),
                update: jest.fn().mockResolvedValue(mockClient),
                delete: jest.fn().mockResolvedValue(mockClient),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ClientsService,
                { provide: PrismaService, useValue: prisma },
                { provide: SupabaseAdminService, useValue: { isConfigured: false, updateUserEmail: jest.fn() } },
            ],
        }).compile();

        service = module.get(ClientsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('findAll should return all clients with matrices', async () => {
        const result = await service.findAll();
        expect(result).toEqual([mockClient]);
        expect(prisma.client.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ include: expect.any(Object) }),
        );
    });

    it('findOne should return a client by id', async () => {
        const result = await service.findOne('client-1');
        expect(result).toEqual(mockClient);
        expect(prisma.client.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: 'client-1' } }),
        );
    });

    it('create should create a new client', async () => {
        const dto = { name: 'New', email: 'new@test.com' };
        await service.create(dto);
        expect(prisma.client.create).toHaveBeenCalledWith(
            expect.objectContaining({ data: dto }),
        );
    });

    it('update should update a client', async () => {
        const dto = { name: 'Updated' };
        await service.update('client-1', dto);
        expect(prisma.client.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'client-1' },
                data: dto,
            }),
        );
    });

    it('softDelete should mark client as deleted', async () => {
        await service.softDelete('client-1');
        expect(prisma.client.update).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: 'client-1' } }),
        );
    });
});
