import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from './auth/auth.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
    template: `
    @if (auth.loading()) {
        <div class="loading-screen">
            <div class="loading-spinner"></div>
        </div>
    } @else if (auth.isAuthenticated()) {
    <div class="shell">
        <aside class="sidebar">
            <div class="sidebar-brand">
                <h2>⬡ Matriz Panel</h2>
                <small>Control de Instancias</small>
            </div>
            <nav>
                <a routerLink="/dashboard" routerLinkActive="active">
                    <span class="icon">📊</span> Dashboard
                </a>
                <a routerLink="/clients" routerLinkActive="active">
                    <span class="icon">👥</span> Clientes
                </a>
                <a routerLink="/vps" routerLinkActive="active">
                    <span class="icon">🖥️</span> Nodos VPS
                </a>
                <a routerLink="/provision" routerLinkActive="active">
                    <span class="icon">🚀</span> Provisionar
                </a>
                <a routerLink="/matrices" routerLinkActive="active">
                    <span class="icon">📦</span> Matrices
                </a>
                <a routerLink="/extensiones" routerLinkActive="active">
                    <span class="icon">📦</span> Extensiones
                </a>
                <a routerLink="/planes" routerLinkActive="active">
                    <span class="icon">💳</span> Planes
                </a>
                <a routerLink="/audit" routerLinkActive="active">
                    <span class="icon">📋</span> Auditoría
                </a>
                <a routerLink="/workers" routerLinkActive="active">
                    <span class="icon">⚙️</span> Workers
                </a>
            </nav>
            <div class="sidebar-footer">
                <div class="user-info">
                    <span class="user-email">{{ auth.userEmail() }}</span>
                </div>
                <button class="btn-logout" (click)="logout()">
                    <span>🚪</span> Cerrar sesión
                </button>
            </div>
        </aside>
        <main class="main-content">
            <router-outlet />
        </main>
    </div>
    } @else {
        <router-outlet />
    }
    `,
    styles: [`
        .loading-screen {
            display: flex; align-items: center; justify-content: center;
            min-height: 100vh; background: var(--bg-primary, #0a0a0f);
        }
        .loading-spinner {
            width: 40px; height: 40px;
            border: 3px solid rgba(108, 92, 231, 0.2);
            border-top-color: #6c5ce7;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
    `],
})
export class AppComponent {
    auth = inject(AuthService);
    private router = inject(Router);

    constructor() {
        // Redirect to /login when not authenticated
        effect(() => {
            if (!this.auth.loading() && !this.auth.isAuthenticated()) {
                const url = this.router.url;
                if (url !== '/login') {
                    this.router.navigateByUrl('/login');
                }
            }
        });
    }

    async logout(): Promise<void> {
        await this.auth.logout();
        this.router.navigateByUrl('/login');
    }
}
