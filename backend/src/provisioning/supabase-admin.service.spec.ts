import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SupabaseAdminService } from './supabase-admin.service';

describe('SupabaseAdminService', () => {
    let service: SupabaseAdminService;
    let configService: ConfigService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SupabaseAdminService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            const vals: Record<string, string> = {
                                SUPABASE_URL: 'https://test.supabase.co',
                                SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
                            };
                            return vals[key] || '';
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get(SupabaseAdminService);
        configService = module.get(ConfigService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should report isConfigured as true', () => {
        expect(service.isConfigured).toBe(true);
    });

    it('should report isConfigured as false when URL is missing', () => {
        jest.spyOn(configService, 'get').mockReturnValue('');
        expect(service.isConfigured).toBe(false);
    });

    describe('createUser', () => {
        it('should throw when not configured', async () => {
            jest.spyOn(configService, 'get').mockReturnValue('');
            await expect(service.createUser('test@test.com', 'pass123'))
                .rejects.toThrow('Supabase not configured');
        });

        it('should create user via Supabase Admin API', async () => {
            const mockUser = { id: 'user-123', email: 'admin@test.com', created_at: '2024-01-01' };
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockUser),
            });

            const result = await service.createUser('admin@test.com', 'pass123');
            expect(result.id).toBe('user-123');
            expect(result.email).toBe('admin@test.com');
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/auth/v1/admin/users'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw on API error', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 422,
                text: () => Promise.resolve('User already exists'),
            });

            await expect(service.createUser('admin@test.com', 'pass123'))
                .rejects.toThrow('Supabase user creation failed (422)');
        });
    });

    describe('deleteUser', () => {
        it('should return false when not configured', async () => {
            jest.spyOn(configService, 'get').mockReturnValue('');
            const result = await service.deleteUser('user-123');
            expect(result).toBe(false);
        });

        it('should delete user via API', async () => {
            global.fetch = jest.fn().mockResolvedValue({ ok: true });
            const result = await service.deleteUser('user-123');
            expect(result).toBe(true);
        });

        it('should return false on delete failure', async () => {
            global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });
            const result = await service.deleteUser('nonexistent');
            expect(result).toBe(false);
        });
    });

    describe('generateAdminPassword', () => {
        it('should generate a 20-char password', () => {
            const pw = service.generateAdminPassword();
            expect(pw).toHaveLength(20);
        });

        it('should generate unique passwords', () => {
            const pw1 = service.generateAdminPassword();
            const pw2 = service.generateAdminPassword();
            expect(pw1).not.toBe(pw2);
        });
    });
});
