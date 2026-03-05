import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-matrices',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    template: `
    <style>
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-border { 0%, 100% { border-color: #3b82f6; } 50% { border-color: #60a5fa; } }
        @keyframes progress { from { width: 0%; } to { width: 100%; } }
        .updating-card { animation: pulse-border 1.5s ease-in-out infinite; border-left-width: 3px !important; }
        .spin-icon { display: inline-block; animation: spin 1s linear infinite; }
        .progress-bar-track {
            height: 3px; background: rgba(59,130,246,0.15); border-radius: 4px;
            margin-top: 10px; overflow: hidden;
        }
        .progress-bar-fill {
            height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa, #3b82f6);
            background-size: 200% auto; border-radius: 4px;
            animation: progress 25s ease-out forwards;
        }
        .update-status {
            display: flex; align-items: center; gap: 8px; margin-top: 10px;
            padding: 10px 14px; border-radius: 8px; font-size: 13px;
            background: rgba(59,130,246,0.08); color: #60a5fa;
        }
    </style>

    <div class="page-header">
        <div>
            <h1>📦 Matrices Desplegadas</h1>
            <p>Gestiona y actualiza tus instancias</p>
        </div>
        <div style="display: flex; gap: 10px;">
            @if (selectedIds.size > 0) {
                <button class="btn btn-primary"
                        style="background: linear-gradient(135deg, #f59e0b, #d97706);"
                        (click)="updateSelected()"
                        [disabled]="updating">
                    {{ updating ? '⏳' : '🔄' }} Actualizar seleccionadas ({{ selectedIds.size }})
                </button>
            }
            <button class="btn btn-secondary" (click)="loadMatrices()" [disabled]="loading">
                {{ loading ? '⏳' : '🔃' }} Refrescar
            </button>
        </div>
    </div>

    @if (loading && matrices.length === 0) {
        <div class="card" style="text-align: center; padding: 40px; color: var(--text-muted);">
            ⏳ Cargando matrices...
        </div>
    }

    @if (!loading && matrices.length === 0) {
        <div class="card" style="text-align: center; padding: 40px;">
            <div style="font-size: 48px; margin-bottom: 12px;">📭</div>
            <h3>No hay matrices desplegadas</h3>
            <p style="color: var(--text-muted);">Ve a <a routerLink="/provision" style="color: var(--accent);">Provisionar</a> para crear una.</p>
        </div>
    }

    @if (matrices.length > 0) {
        <!-- Select all -->
        <div style="margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: var(--text-secondary);">
                <input type="checkbox" [checked]="allSelected" (change)="toggleAll()"
                       style="width: 16px; height: 16px; accent-color: var(--accent); cursor: pointer;">
                Seleccionar todas ({{ matrices.length }})
            </label>
        </div>

        <!-- Matrix cards -->
        @for (m of matrices; track m.id) {
            <div class="card" style="margin-bottom: 12px; padding: 16px; transition: all 0.3s ease;"
                 [class.updating-card]="m._updating"
                 [style.border-left]="'3px solid ' + getStatusColor(m._updating ? 'UPDATING' : m.status)"
                 [style.opacity]="m._updating ? '0.85' : '1'">
                <div style="display: flex; align-items: center; gap: 14px;">
                    <!-- Checkbox -->
                    <input type="checkbox" [checked]="selectedIds.has(m.id)"
                           (change)="toggleSelect(m.id)"
                           style="width: 18px; height: 18px; accent-color: var(--accent); cursor: pointer; flex-shrink: 0;"
                           [disabled]="m._updating">

                    <!-- Info -->
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <a [routerLink]="['/matrices', m.id]"
                               style="font-weight: 600; font-size: 15px; color: var(--text-primary); text-decoration: none;">
                                {{ m.client?.name || m.slug }}
                            </a>
                            <span style="font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600;"
                                  [style.background]="getStatusBg(m._updating ? 'UPDATING' : m.status)"
                                  [style.color]="getStatusColor(m._updating ? 'UPDATING' : m.status)">
                                {{ m._updating ? 'UPDATING' : m.status }}
                            </span>
                        </div>
                        <div style="font-size: 12px; color: var(--text-muted); display: flex; gap: 16px; flex-wrap: wrap;">
                            <span>🌐 <a [href]="'https://' + m.subdomain" target="_blank"
                                        style="color: var(--accent);">{{ m.subdomain }}</a></span>
                            <span>🖥️ {{ m.vpsNode?.host || '—' }}</span>
                            <span>📅 {{ m.createdAt | date:'dd/MM/yyyy' }}</span>
                        </div>
                    </div>

                    <!-- Version & commit -->
                    <div style="text-align: right; flex-shrink: 0;">
                        <div style="font-family: monospace; font-size: 13px; color: var(--text-primary);">
                            {{ m.gitCommit || 'sin versión' }}
                        </div>
                        <div style="font-size: 11px; color: var(--text-muted);">
                            {{ m.gitBranch || 'main' }}
                        </div>
                    </div>

                    <!-- Actions -->
                    <div style="display: flex; gap: 8px; flex-shrink: 0;">
                        @if (m._updating) {
                            <span class="spin-icon" style="font-size: 18px;">⚙️</span>
                        } @else {
                            <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;"
                                    (click)="updateOne(m)" title="Actualizar esta matriz">
                                🔄
                            </button>
                            <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;"
                                    (click)="openMigrateModal(m)" title="Migrar a otro VPS">
                                🚚
                            </button>
                            <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;"
                                    (click)="deleteOne(m)" title="Eliminar esta matriz">
                                🗑️
                            </button>
                        }
                    </div>
                </div>

                <!-- Update progress -->
                @if (m._updating) {
                    <div class="update-status">
                        <span class="spin-icon">🔄</span>
                        <span>{{ m._updateStep || 'Conectando al servidor...' }}</span>
                    </div>
                    <div class="progress-bar-track">
                        <div class="progress-bar-fill"></div>
                    </div>
                }

                <!-- Update result -->
                @if (m._updateResult) {
                    <div style="margin-top: 10px; padding: 10px 14px; border-radius: 8px; font-size: 13px; display: flex; align-items: center; gap: 8px;"
                         [style.background]="m._updateResult === 'error' ? 'rgba(255,107,107,0.1)' : 'rgba(34,197,94,0.1)'"
                         [style.color]="m._updateResult === 'error' ? 'var(--danger)' : 'var(--success)'">
                        <span style="font-size: 16px;">{{ m._updateResult === 'error' ? '❌' : '✅' }}</span>
                        {{ m._updateMessage }}
                    </div>
                }
            </div>
        }
    }

    <!-- Migrate modal -->
    @if (migrateTarget) {
        <div class="modal-overlay" (click)="migrateTarget = null">
            <div class="modal" (click)="$event.stopPropagation()" style="max-width: 440px;">
                <h2 style="font-size: 18px;">🚚 Migrar {{ migrateTarget.client?.name || migrateTarget.slug }}</h2>
                <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
                    VPS actual: <strong>{{ migrateTarget.vpsNode?.name || migrateTarget.vpsNode?.host }}</strong>
                </p>

                <div class="form-group">
                    <label>VPS destino</label>
                    <select class="form-control" [(ngModel)]="migrateTargetVpsId">
                        <option value="" disabled>Selecciona un VPS...</option>
                        @for (vps of availableVps; track vps.id) {
                            <option [value]="vps.id">{{ vps.name }} ({{ vps.host }}) — {{ vps.matrices?.length || 0 }}/{{ vps.maxMatrices }}</option>
                        }
                    </select>
                </div>

                @if (migrateError) {
                    <div style="background: rgba(255,107,107,0.1); border: 1px solid rgba(255,107,107,0.3);
                                border-radius: 8px; padding: 12px; margin-bottom: 16px; color: var(--danger); font-size: 13px;">
                        {{ migrateError }}
                    </div>
                }

                <div class="modal-actions">
                    <button class="btn btn-secondary" (click)="migrateTarget = null">Cancelar</button>
                    <button class="btn btn-primary"
                            style="background: linear-gradient(135deg, #3b82f6, #2563eb);"
                            (click)="startMigration()"
                            [disabled]="!migrateTargetVpsId || migrating">
                        {{ migrating ? '⏳ Migrando...' : '🚚 Migrar' }}
                    </button>
                </div>
            </div>
        </div>
    }
    `,
})
export class MatricesComponent implements OnInit {
    matrices: any[] = [];
    loading = false;
    updating = false;
    selectedIds = new Set<string>();

    // Migration
    migrateTarget: any = null;
    migrateTargetVpsId = '';
    migrateError = '';
    migrating = false;
    availableVps: any[] = [];

    get allSelected(): boolean {
        return this.matrices.length > 0 && this.selectedIds.size === this.matrices.length;
    }

    constructor(private api: ApiService) { }

    ngOnInit() {
        this.loadMatrices();
    }

    loadMatrices() {
        this.loading = true;
        this.api.getMatrices().subscribe({
            next: (data) => {
                this.matrices = data.filter((m: any) => m.status !== 'DELETED');
                this.loading = false;
            },
            error: () => { this.loading = false; },
        });
    }

    toggleSelect(id: string) {
        if (this.selectedIds.has(id)) {
            this.selectedIds.delete(id);
        } else {
            this.selectedIds.add(id);
        }
    }

    toggleAll() {
        if (this.allSelected) {
            this.selectedIds.clear();
        } else {
            this.matrices.forEach(m => this.selectedIds.add(m.id));
        }
    }

    updateOne(m: any) {
        m._updating = true;
        m._updateResult = null;
        m._updateStep = 'Conectando al servidor...';

        // Simulate progress steps (real steps happen server-side)
        const steps = [
            { text: 'Descargando última versión...', delay: 3000 },
            { text: 'Compilando imágenes Docker...', delay: 8000 },
            { text: 'Reiniciando contenedores...', delay: 5000 },
            { text: 'Verificando estado...', delay: 3000 },
        ];
        let stepTimer: any;
        let stepIndex = 0;
        stepTimer = setInterval(() => {
            if (stepIndex < steps.length && m._updating) {
                m._updateStep = steps[stepIndex].text;
                stepIndex++;
            }
        }, 4000);

        this.api.updateMatrix(m.id).subscribe({
            next: (result: any) => {
                clearInterval(stepTimer);
                m._updating = false;
                m._updateStep = null;
                m._updateResult = 'success';
                const commit = result?.commit || result?.message || 'última versión';
                m._updateMessage = `Actualizado a ${commit}`;
                if (result?.commit) m.gitCommit = result.commit;

                // Auto-dismiss after 10s
                setTimeout(() => { m._updateResult = null; }, 10000);
            },
            error: (err: any) => {
                clearInterval(stepTimer);
                m._updating = false;
                m._updateStep = null;
                m._updateResult = 'error';
                m._updateMessage = err.error?.message || 'Error al actualizar';

                // Auto-dismiss error after 15s
                setTimeout(() => { m._updateResult = null; }, 15000);
            },
        });
    }

    async updateSelected() {
        this.updating = true;
        const ids = Array.from(this.selectedIds);
        for (const id of ids) {
            const m = this.matrices.find(x => x.id === id);
            if (m && m.status === 'ACTIVE') {
                await new Promise<void>((resolve) => {
                    this.updateOne(m);
                    // Wait for update to finish
                    const check = setInterval(() => {
                        if (!m._updating) {
                            clearInterval(check);
                            resolve();
                        }
                    }, 1000);
                });
            }
        }
        this.updating = false;
        this.selectedIds.clear();
    }

    deleteOne(m: any) {
        if (!confirm(`¿Eliminar la matriz "${m.client?.name || m.slug}"? Se detendrán los contenedores Docker.`)) return;
        m._updating = true;
        m._updateStep = 'Eliminando contenedores...';
        this.api.deleteMatrix(m.id).subscribe({
            next: () => {
                this.matrices = this.matrices.filter(x => x.id !== m.id);
                this.selectedIds.delete(m.id);
            },
            error: (err: any) => {
                m._updating = false;
                m._updateStep = null;
                m._updateResult = 'error';
                m._updateMessage = err.error?.message || 'Error al eliminar';
            },
        });
    }

    openMigrateModal(m: any) {
        this.migrateTarget = m;
        this.migrateTargetVpsId = '';
        this.migrateError = '';
        this.migrating = false;
        // Load available VPS (exclude current)
        this.api.getVpsNodes().subscribe({
            next: (nodes) => {
                this.availableVps = nodes.filter((n: any) =>
                    n.id !== m.vpsNodeId && n.status === 'ACTIVE' && (n.matrices?.filter((x: any) => !x.deletedAt)?.length || 0) < n.maxMatrices
                );
            },
        });
    }

    startMigration() {
        if (!this.migrateTarget || !this.migrateTargetVpsId) return;
        const m = this.migrateTarget;
        this.migrating = true;
        this.migrateError = '';

        // Show progress on the card
        m._updating = true;
        m._updateResult = null;
        m._updateStep = 'Preparando migración...';

        const steps = [
            { text: 'Deteniendo contenedores...', delay: 3000 },
            { text: 'Exportando base de datos...', delay: 5000 },
            { text: 'Creando archivo de migración...', delay: 5000 },
            { text: 'Transfiriendo al VPS destino...', delay: 10000 },
            { text: 'Descomprimiendo en destino...', delay: 5000 },
            { text: 'Generando nueva configuración...', delay: 3000 },
            { text: 'Iniciando contenedores en destino...', delay: 8000 },
            { text: 'Restaurando base de datos...', delay: 5000 },
            { text: 'Verificando salud...', delay: 3000 },
            { text: 'Actualizando DNS...', delay: 3000 },
            { text: 'Configurando Nginx + SSL...', delay: 5000 },
            { text: 'Limpiando VPS origen...', delay: 3000 },
        ];
        let stepIndex = 0;
        const stepTimer = setInterval(() => {
            if (stepIndex < steps.length && m._updating) {
                m._updateStep = steps[stepIndex].text;
                stepIndex++;
            }
        }, 5000);

        this.api.migrateMatrix(m.id, this.migrateTargetVpsId).subscribe({
            next: (result: any) => {
                clearInterval(stepTimer);
                m._updating = false;
                m._updateStep = null;
                m._updateResult = 'success';
                m._updateMessage = `Migrado exitosamente (commit ${result?.commit || '?'})`;
                this.migrateTarget = null;
                this.migrating = false;
                // Refresh list to show new VPS
                setTimeout(() => this.loadMatrices(), 2000);
                setTimeout(() => { m._updateResult = null; }, 15000);
            },
            error: (err: any) => {
                clearInterval(stepTimer);
                m._updating = false;
                m._updateStep = null;
                m._updateResult = 'error';
                m._updateMessage = err.error?.message || 'Error en la migración';
                this.migrateError = err.error?.message || 'Error en la migración';
                this.migrating = false;
                setTimeout(() => { m._updateResult = null; }, 15000);
            },
        });
    }

    getStatusColor(status: string): string {
        const colors: Record<string, string> = {
            'ACTIVE': '#22c55e', 'PROVISIONING': '#f59e0b', 'ERROR': '#ef4444',
            'SUSPENDED': '#8b5cf6', 'UPDATING': '#3b82f6', 'MIGRATING': '#06b6d4', 'DELETED': '#6b7280',
        };
        return colors[status] || '#6b7280';
    }

    getStatusBg(status: string): string {
        return this.getStatusColor(status) + '18';
    }
}
