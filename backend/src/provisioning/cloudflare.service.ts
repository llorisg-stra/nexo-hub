import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CloudflareResponse<T> {
    success: boolean;
    errors: Array<{ code: number; message: string }>;
    result: T;
}

interface DnsRecord {
    id: string;
    type: string;
    name: string;
    content: string;
    proxied: boolean;
    ttl: number;
}

/**
 * Cloudflare DNS Service — Create/delete A records via Cloudflare API v4.
 */
@Injectable()
export class CloudflareService {
    private readonly logger = new Logger(CloudflareService.name);
    private readonly apiBase = 'https://api.cloudflare.com/client/v4';

    constructor(private readonly config: ConfigService) { }

    private get apiToken(): string {
        return this.config.get<string>('CLOUDFLARE_API_TOKEN', '');
    }

    private get zoneId(): string {
        return this.config.get<string>('CLOUDFLARE_ZONE_ID', '');
    }

    get isConfigured(): boolean {
        return !!this.apiToken && !!this.zoneId;
    }

    /**
     * Create an A record pointing a subdomain to an IP address.
     */
    async createARecord(
        subdomain: string,
        ip: string,
        proxied = true,
    ): Promise<DnsRecord> {
        if (!this.isConfigured) {
            throw new Error(
                'Cloudflare not configured. Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID.',
            );
        }

        const response = await fetch(
            `${this.apiBase}/zones/${this.zoneId}/dns_records`,
            {
                method: 'POST',
                headers: this.headers(),
                body: JSON.stringify({
                    type: 'A',
                    name: subdomain,
                    content: ip,
                    ttl: 1, // Auto
                    proxied,
                }),
            },
        );

        const data: CloudflareResponse<DnsRecord> = await response.json();

        if (!data.success) {
            const errMsg = data.errors.map((e) => e.message).join(', ');
            throw new Error(`Cloudflare DNS create failed: ${errMsg}`);
        }

        this.logger.log(`DNS A record created: ${subdomain} → ${ip}`);
        return data.result;
    }

    /**
     * Delete an A record by subdomain name.
     * Finds the record first, then deletes by ID.
     */
    async deleteARecord(subdomain: string): Promise<boolean> {
        if (!this.isConfigured) return false;

        const records = await this.listRecords(subdomain);
        if (records.length === 0) {
            this.logger.warn(`No DNS record found for ${subdomain}`);
            return false;
        }

        for (const record of records) {
            await fetch(
                `${this.apiBase}/zones/${this.zoneId}/dns_records/${record.id}`,
                { method: 'DELETE', headers: this.headers() },
            );
            this.logger.log(`DNS record deleted: ${record.name} (${record.id})`);
        }

        return true;
    }

    /**
     * List DNS records, optionally filtered by name.
     */
    async listRecords(name?: string): Promise<DnsRecord[]> {
        if (!this.isConfigured) return [];

        const params = new URLSearchParams({ type: 'A', per_page: '100' });
        if (name) params.set('name', name);

        const response = await fetch(
            `${this.apiBase}/zones/${this.zoneId}/dns_records?${params}`,
            { headers: this.headers() },
        );

        const data: CloudflareResponse<DnsRecord[]> = await response.json();
        return data.success ? data.result : [];
    }

    private headers(): Record<string, string> {
        return {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
        };
    }
}
