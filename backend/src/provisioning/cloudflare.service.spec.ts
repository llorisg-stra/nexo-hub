import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CloudflareService } from './cloudflare.service';

describe('CloudflareService', () => {
    let service: CloudflareService;
    let configService: ConfigService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CloudflareService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            const vals: Record<string, string> = {
                                CLOUDFLARE_API_TOKEN: 'test-token',
                                CLOUDFLARE_ZONE_ID: 'test-zone-id',
                            };
                            return vals[key] || '';
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get(CloudflareService);
        configService = module.get(ConfigService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should report isConfigured as true when token and zone are set', () => {
        expect(service.isConfigured).toBe(true);
    });

    it('should report isConfigured as false when token is missing', () => {
        jest.spyOn(configService, 'get').mockReturnValue('');
        expect(service.isConfigured).toBe(false);
    });

    describe('createARecord', () => {
        it('should throw when not configured', async () => {
            jest.spyOn(configService, 'get').mockReturnValue('');
            await expect(service.createARecord('test.example.com', '1.2.3.4'))
                .rejects.toThrow('Cloudflare not configured');
        });

        it('should call Cloudflare API and return record on success', async () => {
            const mockRecord = { id: 'rec-123', type: 'A', name: 'test.example.com', content: '1.2.3.4', proxied: true, ttl: 1 };
            global.fetch = jest.fn().mockResolvedValue({
                json: () => Promise.resolve({ success: true, result: mockRecord, errors: [] }),
            });

            const result = await service.createARecord('test.example.com', '1.2.3.4');
            expect(result.id).toBe('rec-123');
            expect(result.name).toBe('test.example.com');
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/dns_records'),
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('should throw on Cloudflare API error', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                json: () => Promise.resolve({ success: false, errors: [{ code: 1, message: 'Record exists' }], result: null }),
            });

            await expect(service.createARecord('test.example.com', '1.2.3.4'))
                .rejects.toThrow('Record exists');
        });
    });

    describe('deleteARecord', () => {
        it('should return false when not configured', async () => {
            jest.spyOn(configService, 'get').mockReturnValue('');
            const result = await service.deleteARecord('test.example.com');
            expect(result).toBe(false);
        });

        it('should find and delete record', async () => {
            const mockRecords = [{ id: 'rec-456', type: 'A', name: 'test.example.com', content: '1.2.3.4', proxied: true, ttl: 1 }];
            global.fetch = jest.fn()
                .mockResolvedValueOnce({ json: () => Promise.resolve({ success: true, result: mockRecords, errors: [] }) })
                .mockResolvedValueOnce({ ok: true });

            const result = await service.deleteARecord('test.example.com');
            expect(result).toBe(true);
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });
    });

    describe('listRecords', () => {
        it('should return empty array when not configured', async () => {
            jest.spyOn(configService, 'get').mockReturnValue('');
            const result = await service.listRecords();
            expect(result).toEqual([]);
        });

        it('should return records from API', async () => {
            const mockRecords = [{ id: 'r1', type: 'A', name: 'a.com', content: '1.1.1.1', proxied: true, ttl: 1 }];
            global.fetch = jest.fn().mockResolvedValue({
                json: () => Promise.resolve({ success: true, result: mockRecords, errors: [] }),
            });

            const result = await service.listRecords();
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('r1');
        });
    });
});
