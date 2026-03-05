import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SupabaseUser {
    id: string;
    email: string;
    created_at: string;
}

/**
 * Supabase Admin Service — Create/delete users via Supabase Admin API.
 * Uses the service_role_key for admin-level operations.
 */
@Injectable()
export class SupabaseAdminService {
    private readonly logger = new Logger(SupabaseAdminService.name);

    constructor(private readonly config: ConfigService) { }

    private get supabaseUrl(): string {
        return this.config.get<string>('SUPABASE_URL', '');
    }

    private get serviceRoleKey(): string {
        return this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY', '');
    }

    get isConfigured(): boolean {
        return !!this.supabaseUrl && !!this.serviceRoleKey;
    }

    /**
     * Create an admin user in Supabase Auth for a new matrix instance.
     */
    async createUser(
        email: string,
        password: string,
        tenantId: string,
        metadata?: Record<string, unknown>,
    ): Promise<SupabaseUser> {
        if (!this.isConfigured) {
            throw new Error(
                'Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
            );
        }

        const response = await fetch(
            `${this.supabaseUrl}/auth/v1/admin/users`,
            {
                method: 'POST',
                headers: this.headers(),
                body: JSON.stringify({
                    email,
                    password,
                    email_confirm: true, // Auto-confirm email
                    app_metadata: {
                        role: 'admin',
                        tenant: tenantId,
                    },
                    user_metadata: {
                        role: 'admin',
                        tenant: tenantId,
                        ...metadata,
                    },
                }),
            },
        );

        if (!response.ok) {
            const error = await response.text();

            // If user already exists, fetch and return the existing user
            if (response.status === 422 && error.includes('email_exists')) {
                this.logger.warn(`Supabase user ${email} already exists — reusing existing user`);
                const existing = await this.findUserByEmail(email);
                if (existing) return existing;
            }

            throw new Error(
                `Supabase user creation failed (${response.status}): ${error}`,
            );
        }

        const user: SupabaseUser = await response.json();
        this.logger.log(`Supabase user created: ${email} (${user.id})`);
        return user;
    }

    /**
     * Find a Supabase Auth user by email via admin API.
     */
    async findUserByEmail(email: string): Promise<SupabaseUser | null> {
        if (!this.isConfigured) return null;

        const response = await fetch(
            `${this.supabaseUrl}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`,
            { method: 'GET', headers: this.headers() },
        );

        if (!response.ok) return null;

        const data = await response.json();
        const users: SupabaseUser[] = data.users || data || [];
        const match = users.find(u => u.email === email);
        return match || null;
    }

    /**
     * Delete a Supabase Auth user by ID.
     */
    async deleteUser(userId: string): Promise<boolean> {
        if (!this.isConfigured) return false;

        const response = await fetch(
            `${this.supabaseUrl}/auth/v1/admin/users/${userId}`,
            { method: 'DELETE', headers: this.headers() },
        );

        if (!response.ok) {
            this.logger.warn(`Failed to delete Supabase user ${userId}: ${response.status}`);
            return false;
        }

        this.logger.log(`Supabase user deleted: ${userId}`);
        return true;
    }

    /**
     * Update a Supabase Auth user's email by user ID.
     */
    async updateUserEmail(userId: string, newEmail: string): Promise<boolean> {
        if (!this.isConfigured) return false;

        const response = await fetch(
            `${this.supabaseUrl}/auth/v1/admin/users/${userId}`,
            {
                method: 'PUT',
                headers: this.headers(),
                body: JSON.stringify({
                    email: newEmail,
                    email_confirm: true, // Auto-confirm the new email
                }),
            },
        );

        if (!response.ok) {
            const error = await response.text();
            this.logger.warn(`Failed to update Supabase user ${userId} email: ${response.status} ${error}`);
            return false;
        }

        this.logger.log(`Supabase user ${userId} email updated to: ${newEmail}`);
        return true;
    }

    /**
     * Generate a secure random password for new matrix admins.
     */
    generateAdminPassword(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&';
        const length = 20;
        const bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        return Array.from(bytes, (b) => chars[b % chars.length]).join('');
    }

    private headers(): Record<string, string> {
        return {
            Authorization: `Bearer ${this.serviceRoleKey}`,
            apikey: this.serviceRoleKey,
            'Content-Type': 'application/json',
        };
    }
}
