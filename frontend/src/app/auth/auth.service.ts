import { Injectable, signal, computed } from '@angular/core';
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private supabase: SupabaseClient;
    private sessionSignal = signal<Session | null>(null);
    private loadingSignal = signal(true);

    readonly session = this.sessionSignal.asReadonly();
    readonly isAuthenticated = computed(() => !!this.sessionSignal());
    readonly loading = this.loadingSignal.asReadonly();
    readonly userEmail = computed(() => this.sessionSignal()?.user?.email ?? null);

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
        this.initSession();
    }

    private async initSession(): Promise<void> {
        try {
            const { data } = await this.supabase.auth.getSession();
            this.sessionSignal.set(data.session);
        } catch {
            this.sessionSignal.set(null);
        } finally {
            this.loadingSignal.set(false);
        }

        this.supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
            this.sessionSignal.set(session);
        });
    }

    async login(email: string, password: string): Promise<{ error: any | null }> {
        const { error } = await this.supabase.auth.signInWithPassword({ email, password });
        return { error };
    }

    async logout(): Promise<void> {
        await this.supabase.auth.signOut();
        this.sessionSignal.set(null);
    }

    getAccessToken(): string | null {
        return this.sessionSignal()?.access_token ?? null;
    }
}

