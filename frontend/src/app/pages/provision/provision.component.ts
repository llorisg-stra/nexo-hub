import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-provision',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="page-header">
        <div>
            <h1>🚀 Provisionar Nueva Matriz</h1>
            <p>Despliegue completo paso a paso</p>
        </div>
    </div>

    <!-- ========== STEP 1: Client + VPS ========== -->
    @if (step === 1 && !provisioning && !completed) {
        <div class="card" style="max-width: 650px;">
            <div class="step-indicator">
                <div class="step-dot active">1</div>
                <div class="step-line"></div>
                <div class="step-dot">2</div>
            </div>

            <!-- Client Section -->
            <div class="section-title">👤 Cliente</div>
            <div class="toggle-group">
                <button class="toggle-btn" [class.active]="clientMode === 'existing'" (click)="clientMode = 'existing'">
                    Existente
                </button>
                <button class="toggle-btn" [class.active]="clientMode === 'new'" (click)="clientMode = 'new'">
                    Nuevo
                </button>
            </div>

            @if (clientMode === 'existing') {
                <div class="form-group">
                    <label>Seleccionar cliente</label>
                    <select class="form-control" [(ngModel)]="selectedClientId">
                        <option value="">-- Selecciona un cliente --</option>
                        @for (c of clients; track c.id) {
                            <option [value]="c.id">{{ c.name }} ({{ c.email }})</option>
                        }
                    </select>
                    @if (clients.length === 0 && !loadingClients) {
                        <small style="color: var(--text-muted); font-size: 12px; margin-top: 4px; display: block;">
                            No hay clientes registrados. Crea uno nuevo.
                        </small>
                    }
                </div>
            } @else {
                <div class="form-group">
                    <label>Nombre del cliente *</label>
                    <input class="form-control" [(ngModel)]="clientName" placeholder="Grupo Lamadrid">
                </div>
                <div class="form-group">
                    <label>Email del cliente *</label>
                    <input class="form-control" type="email" [(ngModel)]="clientEmail" placeholder="admin@empresa.com">
                </div>
            }

            <div style="border-top: 1px solid rgba(255,255,255,0.08); margin: 20px 0;"></div>

            <!-- VPS Section -->
            <div class="section-title">🖥️ VPS</div>
            <div class="toggle-group">
                <button class="toggle-btn" [class.active]="vpsMode === 'existing'" (click)="vpsMode = 'existing'">
                    Existente
                </button>
                <button class="toggle-btn" [class.active]="vpsMode === 'new'" (click)="vpsMode = 'new'">
                    Nuevo
                </button>
            </div>

            @if (vpsMode === 'existing') {
                <div class="form-group">
                    <label>Seleccionar VPS</label>
                    <select class="form-control" [(ngModel)]="selectedVpsId">
                        <option value="">-- Selecciona un VPS --</option>
                        @for (v of vpsNodes; track v.id) {
                            <option [value]="v.id" [disabled]="getAvailableSlots(v) <= 0">
                                {{ v.name }} — {{ v.host }} ({{ getAvailableSlots(v) }} slots libres)
                            </option>
                        }
                    </select>
                    @if (vpsNodes.length === 0 && !loadingVps) {
                        <small style="color: var(--text-muted); font-size: 12px; margin-top: 4px; display: block;">
                            No hay VPS registrados. Crea uno desde "Nodos VPS" o selecciona "Nuevo".
                        </small>
                    }
                </div>
            } @else {
                <div class="form-group">
                    <label>IP del VPS *</label>
                    <input class="form-control" [(ngModel)]="vpsIp" placeholder="149.202.56.233"
                           style="font-family: monospace;">
                </div>
                <div class="form-group">
                    <label>Password SSH *</label>
                    <input class="form-control" type="password" [(ngModel)]="sshPassword"
                           placeholder="Contraseña del VPS">
                </div>
            }

            @if (error) {
                <div class="error-box">{{ error }}</div>
            }

            <button class="btn btn-primary next-btn" (click)="goToStep2()" [disabled]="!canGoToStep2()">
                Continuar →
            </button>
        </div>
    }

    <!-- ========== STEP 2: Matrix config ========== -->
    @if (step === 2 && !provisioning && !completed) {
        <div class="card" style="max-width: 650px;">
            <div class="step-indicator">
                <div class="step-dot completed">✓</div>
                <div class="step-line active"></div>
                <div class="step-dot active">2</div>
            </div>

            <div style="background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.15);
                        border-radius: 10px; padding: 14px; margin-bottom: 20px; font-size: 13px;
                        color: var(--text-secondary); display: flex; gap: 10px; align-items: start;">
                <span style="font-size: 20px;">⚡</span>
                <div>
                    <strong style="color: var(--text-primary); display: block; margin-bottom: 4px;">
                        Se crean automáticamente:
                    </strong>
                    DNS (Cloudflare) · Supabase Auth · Docker Stack (PostgreSQL, Redis, n8n, Backend, Frontend) · Nginx + SSL
                </div>
            </div>

            <!-- Summary of step 1 selections -->
            <div style="background: var(--bg-secondary); border-radius: 8px; padding: 12px 16px;
                        margin-bottom: 20px; font-size: 13px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <span style="color: var(--text-muted);">👤 Cliente:</span>
                    <strong>{{ getClientSummary() }}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--text-muted);">🖥️ VPS:</span>
                    <strong>{{ getVpsSummary() }}</strong>
                </div>
                <button class="btn-link" (click)="step = 1" style="margin-top: 8px; font-size: 12px;">← Cambiar</button>
            </div>

            <div class="section-title">📋 Datos de la Matriz</div>
            <div class="form-group">
                <label>Dominio *</label>
                <input class="form-control" [(ngModel)]="domain"
                       placeholder="cliente.strategialaboratory.com"
                       style="font-family: monospace;">
                <small style="color: var(--text-muted); font-size: 12px; margin-top: 4px; display: block;">
                    Subdominio del cliente, ej: nombre-cliente.strategialaboratory.com
                </small>
            </div>

            <div style="border-top: 1px solid rgba(255,255,255,0.08); margin: 16px 0; padding-top: 16px;">
                <div style="font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 12px;">🔑 Credenciales del Admin</div>
            </div>
            <div class="form-group">
                <label>Email del admin *</label>
                <input class="form-control" type="email" [(ngModel)]="adminEmail"
                       placeholder="admin@empresa.com">
            </div>
            <div class="form-group">
                <label>Password del admin *</label>
                <input class="form-control" type="password" [(ngModel)]="adminPassword"
                       placeholder="Mínimo 6 caracteres">
            </div>

            @if (error) {
                <div class="error-box">{{ error }}</div>
            }

            <button class="btn btn-primary deploy-btn"
                    (click)="provision()"
                    [disabled]="!domain || !adminEmail || !adminPassword">
                🚀 Desplegar Matriz
            </button>
        </div>
    }

    <!-- ========== STEP 3: Progress ========== -->
    @if (provisioning) {
        <div class="card" style="max-width: 700px;">
            <h3 style="margin-bottom: 16px;">Desplegando {{ domain.split('.')[0] }}...</h3>
            <div style="background: var(--bg-secondary); border-radius: 8px; padding: 16px;
                        margin-bottom: 16px; font-size: 13px; color: var(--text-secondary);">
                <div>🌐 <strong>{{ domain }}</strong></div>
            </div>

            <!-- Step progress -->
            <div style="margin-bottom: 16px;">
                @for (s of provisionSteps; track s.name) {
                    <div style="display: flex; align-items: center; gap: 10px; padding: 6px 0; font-size: 13px;
                                border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <span style="font-size: 16px;">
                            @if (s.status === 'OK') { ✅ }
                            @else if (s.status === 'RUNNING') { ⏳ }
                            @else if (s.status === 'FAILED') { ❌ }
                            @else { ⬜ }
                        </span>
                        <span [style.color]="s.status === 'FAILED' ? 'var(--danger)' : s.status === 'OK' ? 'var(--success)' : 'var(--text-secondary)'">
                            {{ s.label }}
                        </span>
                        @if (s.message && s.status === 'FAILED') {
                            <span style="color: var(--danger); font-size: 11px; margin-left: auto;">{{ s.message }}</span>
                        }
                    </div>
                }
            </div>

            @if (currentStatus === 'ERROR') {
                <div class="error-box">
                    ❌ Error en el provisioning. Revisa los logs del panel-backend.
                </div>
            } @else {
                <div style="margin-top: 12px; height: 4px; background: var(--bg-secondary); border-radius: 2px; overflow: hidden;">
                    <div [style.width.%]="progressPercent"
                         style="height: 100%; background: linear-gradient(90deg, #f59e0b, #22c55e);
                                border-radius: 2px; transition: width 0.5s ease;"></div>
                </div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px; text-align: center;">
                    {{ progressPercent }}% — Paso {{ completedSteps }}/{{ totalSteps }} (puede tardar 3-5 minutos)
                </div>
            }
        </div>
    }

    <!-- ========== COMPLETED ========== -->
    @if (completed) {
        <div class="card" style="max-width: 600px; text-align: center; padding: 40px;">
            <div style="font-size: 56px;">🎉</div>
            <h2 style="margin: 12px 0 8px;">¡Matriz desplegada!</h2>
            <p style="color: var(--text-secondary); margin-bottom: 16px;">
                La matriz está operativa en
                <a [href]="'https://' + domain" target="_blank" style="color: var(--accent);">{{ domain }}</a>
            </p>
            <div style="background: var(--bg-secondary); border-radius: 10px; padding: 16px; margin-bottom: 20px;
                        text-align: left; font-size: 13px;">
                <div style="font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">🔑 Credenciales de acceso:</div>
                <div style="display: grid; grid-template-columns: auto 1fr; gap: 4px 12px;">
                    <span style="color: var(--text-muted);">Email:</span>
                    <span style="font-family: monospace;">{{ adminEmail }}</span>
                    <span style="color: var(--text-muted);">Password:</span>
                    <span style="font-family: monospace;">{{ adminPassword }}</span>
                    <span style="color: var(--text-muted);">URL:</span>
                    <a [href]="'https://' + domain" target="_blank" style="color: var(--accent); font-family: monospace;">{{ domain }}</a>
                </div>
            </div>
            <div style="display: flex; gap: 12px; justify-content: center;">
                <a [href]="'https://' + domain" target="_blank" class="btn btn-primary">Abrir Matriz</a>
                <button class="btn btn-secondary" (click)="reset()">Nueva Matriz</button>
            </div>
        </div>
    }
    `,
    styles: [`
        .step-indicator {
            display: flex; align-items: center; justify-content: center; gap: 0;
            margin-bottom: 24px;
        }
        .step-dot {
            width: 32px; height: 32px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 14px; font-weight: 700;
            background: var(--bg-secondary); color: var(--text-muted);
            border: 2px solid rgba(255,255,255,0.1);
            transition: all 0.3s ease;
        }
        .step-dot.active {
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: white; border-color: #6366f1;
        }
        .step-dot.completed {
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: white; border-color: #22c55e; font-size: 12px;
        }
        .step-line {
            width: 60px; height: 2px; background: rgba(255,255,255,0.1);
        }
        .step-line.active {
            background: linear-gradient(90deg, #22c55e, #6366f1);
        }
        .section-title {
            font-size: 15px; font-weight: 700; color: var(--text-primary);
            margin-bottom: 12px;
        }
        .toggle-group {
            display: flex; gap: 0; margin-bottom: 16px;
            border-radius: 8px; overflow: hidden;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .toggle-btn {
            flex: 1; padding: 8px 16px; font-size: 13px; font-weight: 600;
            background: var(--bg-secondary); color: var(--text-muted);
            border: none; cursor: pointer; transition: all 0.2s ease;
        }
        .toggle-btn.active {
            background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2));
            color: var(--text-primary);
        }
        .toggle-btn:hover:not(.active) {
            background: rgba(255,255,255,0.05);
        }
        .error-box {
            background: rgba(255,107,107,0.1); border: 1px solid rgba(255,107,107,0.3);
            border-radius: 8px; padding: 12px; margin-bottom: 16px;
            color: var(--danger); font-size: 13px;
        }
        .next-btn {
            width: 100%; justify-content: center; padding: 14px;
            font-size: 15px; margin-top: 8px;
        }
        .deploy-btn {
            width: 100%; justify-content: center; padding: 14px;
            font-size: 16px; background: linear-gradient(135deg, #22c55e, #16a34a);
            margin-top: 8px;
        }
        .btn-link {
            background: none; border: none; color: var(--accent);
            cursor: pointer; padding: 0; text-decoration: underline;
        }
        .btn-link:hover { opacity: 0.8; }

        select.form-control {
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 12px center;
            padding-right: 32px;
        }
        select.form-control option { background: #1a1a2e; color: #e0e0e0; }
        select.form-control option:disabled { color: #555; }
    `],
})
export class ProvisionComponent implements OnInit, OnDestroy {
    // Step control
    step = 1;

    // Step 1: Client
    clientMode: 'existing' | 'new' = 'existing';
    clients: any[] = [];
    loadingClients = true;
    selectedClientId = '';
    clientName = '';
    clientEmail = '';

    // Step 1: VPS
    vpsMode: 'existing' | 'new' = 'existing';
    vpsNodes: any[] = [];
    loadingVps = true;
    selectedVpsId = '';
    vpsIp = '';
    sshPassword = '';

    // Step 2: Matrix
    domain = '';
    adminEmail = '';
    adminPassword = '';

    // Step 3: Progress
    provisioning = false;
    completed = false;
    error = '';
    currentStatus = '';
    pollingInterval: any = null;
    pollingStartTime = 0;
    slug = '';

    provisionSteps: Array<{ name: string; label: string; status: string; message: string }> = [];
    readonly stepLabels: Record<string, string> = {
        'PREPARE_VPS': '1. Deploy (clone, Docker, DNS, Nginx, SSL)',
        'HEALTH_CHECK': '2. Health check',
        'CREATE_ADMIN': '3. Crear admin (Supabase)',
        'SYNC_PLUGINS': '4. Sincronizar plugins',
        'SYNC_PACKAGES': '5. Instalar extensiones',
        'DONE': '✅ Completado',
    };

    get totalSteps() { return Object.keys(this.stepLabels).length; }
    get completedSteps() { return this.provisionSteps.filter(s => s.status === 'OK').length; }
    get progressPercent() { return Math.round((this.completedSteps / this.totalSteps) * 100); }

    constructor(private api: ApiService, private router: Router) {
        for (const [name, label] of Object.entries(this.stepLabels)) {
            this.provisionSteps.push({ name, label, status: 'PENDING', message: '' });
        }
    }

    ngOnInit() {
        this.loadClients();
        this.loadVpsNodes();
    }

    ngOnDestroy() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
    }

    loadClients() {
        this.loadingClients = true;
        this.api.getClients().subscribe({
            next: (data: any[]) => { this.clients = data; this.loadingClients = false; },
            error: () => { this.loadingClients = false; },
        });
    }

    loadVpsNodes() {
        this.loadingVps = true;
        this.api.getVpsNodes().subscribe({
            next: (data: any[]) => { this.vpsNodes = data; this.loadingVps = false; },
            error: () => { this.loadingVps = false; },
        });
    }

    getAvailableSlots(vps: any): number {
        const active = (vps.matrices || []).filter((m: any) => m.status !== 'DELETED').length;
        return vps.maxMatrices - active;
    }

    getClientSummary(): string {
        if (this.clientMode === 'existing') {
            const c = this.clients.find(c => c.id === this.selectedClientId);
            return c ? `${c.name} (${c.email})` : '—';
        }
        return `${this.clientName} (nuevo)`;
    }

    getVpsSummary(): string {
        if (this.vpsMode === 'existing') {
            const v = this.vpsNodes.find(v => v.id === this.selectedVpsId);
            return v ? `${v.name} — ${v.host}` : '—';
        }
        return `${this.vpsIp} (nuevo)`;
    }

    canGoToStep2(): boolean {
        const clientOk = this.clientMode === 'existing'
            ? !!this.selectedClientId
            : !!this.clientName && !!this.clientEmail;
        const vpsOk = this.vpsMode === 'existing'
            ? !!this.selectedVpsId
            : !!this.vpsIp && !!this.sshPassword;
        return clientOk && vpsOk;
    }

    goToStep2() {
        if (!this.canGoToStep2()) return;
        this.error = '';

        // Pre-fill admin email from client if new
        if (this.clientMode === 'new' && !this.adminEmail) {
            this.adminEmail = this.clientEmail;
        }
        // Pre-fill from existing client
        if (this.clientMode === 'existing' && !this.adminEmail) {
            const c = this.clients.find(c => c.id === this.selectedClientId);
            if (c) this.adminEmail = c.email;
        }

        this.step = 2;
    }

    provision() {
        this.provisioning = true;
        this.error = '';
        this.provisionSteps.forEach(s => { s.status = 'PENDING'; s.message = ''; });

        const payload: any = {
            domain: this.domain,
            adminEmail: this.adminEmail,
            adminPassword: this.adminPassword,
        };

        // Client
        if (this.clientMode === 'existing') {
            payload.clientId = this.selectedClientId;
        } else {
            payload.clientName = this.clientName;
        }

        // VPS
        if (this.vpsMode === 'existing') {
            payload.vpsNodeId = this.selectedVpsId;
        } else {
            payload.vpsIp = this.vpsIp;
            payload.sshPassword = this.sshPassword;
        }

        this.api.oneClickProvision(payload).subscribe({
            next: (result: any) => {
                this.slug = result.slug;
                this.startPolling();
            },
            error: (err: any) => {
                this.provisioning = false;
                this.error = err.error?.message || err.message || 'Error al iniciar provisioning';
            },
        });
    }

    startPolling() {
        this.pollingStartTime = Date.now();
        this.pollingInterval = setInterval(() => {
            // Safety timeout: stop polling after 60s if matrix never appears
            if (Date.now() - this.pollingStartTime > 60_000) {
                const matrix = this.provisionSteps.find(s => s.status !== 'PENDING');
                if (!matrix) {
                    this.stopPolling();
                    this.currentStatus = 'ERROR';
                    this.error = 'Timeout: no se pudo encontrar la matriz. Revisa los logs del backend.';
                    return;
                }
            }

            this.api.getMatrices().subscribe({
                next: (matrices: any[]) => {
                    const matrix = matrices.find((m: any) => m.slug === this.slug);
                    if (!matrix) return;

                    this.currentStatus = matrix.status;

                    this.api.getMatrix(matrix.id).subscribe({
                        next: (detail: any) => {
                            if (detail.events) {
                                for (const event of detail.events) {
                                    const step = this.provisionSteps.find(s => s.name === event.step);
                                    if (step) {
                                        step.status = event.status;
                                        step.message = event.message || '';
                                    }
                                }
                            }

                            if (matrix.status === 'ACTIVE') {
                                this.stopPolling();
                                this.provisioning = false;
                                this.completed = true;
                            } else if (matrix.status === 'ERROR') {
                                this.stopPolling();
                            }
                        },
                    });
                },
            });
        }, 3000);
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    reset() {
        this.step = 1;
        this.clientMode = 'existing';
        this.selectedClientId = '';
        this.clientName = '';
        this.clientEmail = '';
        this.vpsMode = 'existing';
        this.selectedVpsId = '';
        this.vpsIp = '';
        this.sshPassword = '';
        this.domain = '';
        this.adminEmail = '';
        this.adminPassword = '';
        this.completed = false;
        this.provisioning = false;
        this.error = '';
        this.currentStatus = '';
        this.slug = '';
        this.provisionSteps.forEach(s => { s.status = 'PENDING'; s.message = ''; });
        this.loadClients();
        this.loadVpsNodes();
    }
}
