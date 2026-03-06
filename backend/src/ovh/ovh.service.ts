import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// The 'ovh' package doesn't ship TS types
// eslint-disable-next-line @typescript-eslint/no-var-requires
const OvhApi = require('ovh');

// ── Types ───────────────────────────────────────────────────
export interface OvhVpsSummary {
    name: string;           // e.g. "vps-xxxx.vps.ovh.net"
    displayName: string;
    state: string;          // "running" | "stopped" | ...
    model: { name: string; memory: number; vcore: number; disk: number };
    zone: string;
    ips: string[];
}

export interface OvhVpsStatus {
    state: string;
    uptime: number;
    netbootMode: string;
    memoryLimit: number;
}

export interface OvhVpsImage {
    id: string;
    name: string;
    availableLanguages: string[];
}

export interface OvhVpsMonitoring {
    cpu: { timestamp: number; value: number }[];
    ram: { timestamp: number; value: number }[];
    netRx: { timestamp: number; value: number }[];
    netTx: { timestamp: number; value: number }[];
}

export interface OvhSshKey {
    keyName: string;
    key: string;
    default: boolean;
}

// ── Service ─────────────────────────────────────────────────
@Injectable()
export class OvhService implements OnModuleInit {
    private readonly logger = new Logger(OvhService.name);
    private client: any;
    private sshKeyName = 'nexo-hub-deploy';

    constructor(private readonly config: ConfigService) { }

    async onModuleInit() {
        const appKey = this.config.get<string>('OVH_APP_KEY');
        const appSecret = this.config.get<string>('OVH_APP_SECRET');
        const consumerKey = this.config.get<string>('OVH_CONSUMER_KEY');

        if (!appKey || !appSecret || !consumerKey) {
            this.logger.warn('OVH API credentials not configured. OVH features disabled.');
            return;
        }

        this.client = new OvhApi({
            endpoint: this.config.get<string>('OVH_ENDPOINT', 'ovh-eu'),
            appKey,
            appSecret,
            consumerKey,
        });

        this.logger.log('OVH API client initialized');

        // Auto-register SSH key if not already present
        await this.ensureSshKeyRegistered();
    }

    private ensureClient() {
        if (!this.client) {
            throw new Error('OVH API client not configured. Set OVH_APP_KEY, OVH_APP_SECRET, OVH_CONSUMER_KEY.');
        }
    }

    private request(method: string, path: string, data?: any): Promise<any> {
        this.ensureClient();
        return new Promise((resolve, reject) => {
            const cb = (err: any, result: any) => {
                if (err) reject(err);
                else resolve(result);
            };
            if (data) {
                this.client.request(method, path, data, cb);
            } else {
                this.client.request(method, path, cb);
            }
        });
    }

    // ── VPS Discovery ───────────────────────────────────────

    /** List all VPS service names */
    async listVps(): Promise<string[]> {
        return this.request('GET', '/vps');
    }

    /** Get full details of a single VPS */
    async getVpsDetails(serviceName: string): Promise<OvhVpsSummary> {
        const [details, ips] = await Promise.all([
            this.request('GET', `/vps/${serviceName}`),
            this.request('GET', `/vps/${serviceName}/ips`).catch(() => []),
        ]);

        return {
            name: details.name,
            displayName: details.displayName || details.name,
            state: details.state,
            model: {
                name: details.model?.name || 'unknown',
                memory: details.model?.ram || 0,
                vcore: details.model?.vcore || 0,
                disk: details.model?.disk || 0,
            },
            zone: details.zone || '',
            ips,
        };
    }

    /** Get all VPS with their details (batch) */
    async listVpsWithDetails(): Promise<OvhVpsSummary[]> {
        const names = await this.listVps();
        const results = await Promise.allSettled(
            names.map(name => this.getVpsDetails(name)),
        );
        return results
            .filter((r): r is PromiseFulfilledResult<OvhVpsSummary> => r.status === 'fulfilled')
            .map(r => r.value);
    }

    // ── VPS Status & Monitoring ─────────────────────────────

    /** Get VPS status (state, uptime, netboot) */
    async getVpsStatus(serviceName: string): Promise<OvhVpsStatus> {
        return this.request('GET', `/vps/${serviceName}/status`);
    }

    /** Get VPS monitoring data (CPU, RAM, Network) */
    async getMonitoring(serviceName: string, period: 'lastday' | 'lastweek' | 'lastmonth' = 'lastday'): Promise<OvhVpsMonitoring> {
        const [cpu, ram, netRx, netTx] = await Promise.all([
            this.request('GET', `/vps/${serviceName}/monitoring?period=${period}&type=cpu:used`).catch(() => ({ values: [] })),
            this.request('GET', `/vps/${serviceName}/monitoring?period=${period}&type=mem:used`).catch(() => ({ values: [] })),
            this.request('GET', `/vps/${serviceName}/monitoring?period=${period}&type=net:rx`).catch(() => ({ values: [] })),
            this.request('GET', `/vps/${serviceName}/monitoring?period=${period}&type=net:tx`).catch(() => ({ values: [] })),
        ]);

        return {
            cpu: cpu.values || [],
            ram: ram.values || [],
            netRx: netRx.values || [],
            netTx: netTx.values || [],
        };
    }

    // ── VPS Management ──────────────────────────────────────

    /** Get available OS images for a VPS */
    async getAvailableImages(serviceName: string): Promise<OvhVpsImage[]> {
        const imageIds: string[] = await this.request('GET', `/vps/${serviceName}/images/available`);
        const results = await Promise.allSettled(
            imageIds.map(id => this.request('GET', `/vps/${serviceName}/images/available/${id}`)),
        );
        return results
            .filter((r): r is PromiseFulfilledResult<OvhVpsImage> => r.status === 'fulfilled')
            .map(r => r.value);
    }

    /** Reinstall a VPS with a specific image + auto SSH key */
    async reinstallVps(serviceName: string, imageId: string): Promise<any> {
        this.logger.warn(`Reinstalling VPS ${serviceName} with image ${imageId}`);

        // Try to include SSH key for passwordless access
        const sshKey = await this.getSshKey(this.sshKeyName).catch(() => null);
        const payload: any = { imageId };
        if (sshKey) {
            payload.sshKey = sshKey.keyName;
            this.logger.log(`Including SSH key '${sshKey.keyName}' in reinstall`);
        }

        return this.request('POST', `/vps/${serviceName}/reinstall`, payload);
    }

    /** Reboot a VPS via OVH API (hard reboot) */
    async rebootVps(serviceName: string): Promise<any> {
        this.logger.warn(`Rebooting VPS ${serviceName} via OVH API`);
        return this.request('POST', `/vps/${serviceName}/reboot`);
    }

    /** Update VPS display name */
    async renameVps(serviceName: string, displayName: string): Promise<any> {
        return this.request('PUT', `/vps/${serviceName}`, { displayName });
    }

    // ── Dedicated Server ────────────────────────────────────

    /** List all dedicated servers */
    async listDedicatedServers(): Promise<string[]> {
        return this.request('GET', '/dedicated/server');
    }

    /** Get dedicated server details */
    async getDedicatedServerDetails(serviceName: string): Promise<any> {
        return this.request('GET', `/dedicated/server/${serviceName}`);
    }

    // ── SSH Key Management ──────────────────────────────────

    /** List all SSH keys registered in OVH account */
    async listSshKeys(): Promise<string[]> {
        return this.request('GET', '/me/sshKey');
    }

    /** Get a specific SSH key by name */
    async getSshKey(keyName: string): Promise<OvhSshKey> {
        return this.request('GET', `/me/sshKey/${keyName}`);
    }

    /** Register a new SSH key in OVH account */
    async registerSshKey(keyName: string, publicKey: string): Promise<OvhSshKey> {
        this.logger.log(`Registering SSH key '${keyName}' in OVH account`);
        return this.request('POST', '/me/sshKey', {
            keyName,
            key: publicKey,
        });
    }

    /** Delete an SSH key from OVH account */
    async deleteSshKey(keyName: string): Promise<void> {
        return this.request('DELETE', `/me/sshKey/${keyName}`);
    }

    /** Read local SSH public key */
    getLocalPublicKey(): string | null {
        const paths = [
            join(homedir(), '.ssh', 'id_ed25519.pub'),
            join(homedir(), '.ssh', 'id_rsa.pub'),
        ];
        for (const p of paths) {
            if (existsSync(p)) {
                return readFileSync(p, 'utf-8').trim();
            }
        }
        return null;
    }

    /** Ensure our SSH key is registered in OVH (idempotent) */
    private async ensureSshKeyRegistered(): Promise<void> {
        try {
            const existing = await this.listSshKeys();
            if (existing.includes(this.sshKeyName)) {
                this.logger.log(`SSH key '${this.sshKeyName}' already registered in OVH`);
                return;
            }

            const pubKey = this.getLocalPublicKey();
            if (!pubKey) {
                this.logger.warn('No local SSH public key found (~/.ssh/id_ed25519.pub). Auto-registration skipped.');
                return;
            }

            await this.registerSshKey(this.sshKeyName, pubKey);
            this.logger.log(`SSH key '${this.sshKeyName}' registered in OVH ✅`);
        } catch (err: any) {
            this.logger.warn(`SSH key auto-registration failed: ${err.message || err}`);
        }
    }
}
