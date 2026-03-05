import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-workers',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="page-header">
        <div>
            <h1>⚙️ Worker Fleet</h1>
            <p>Servidores de procesamiento de documentos</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">➕ Nuevo Worker</button>
    </div>

    @if (showForm) {
        <div class="modal-overlay" (click)="closeForm()">
            <div class="modal" (click)="$event.stopPropagation()">
                <h2>{{ editingId ? '✏️ Editar Worker' : '➕ Nuevo Worker' }}</h2>
                <div class="form-group">
                    <label>Nombre *</label>
                    <input class="form-control" [(ngModel)]="form.name" placeholder="worker-01">
                </div>
                <div class="form-group">
                    <label>Host (IP WireGuard) *</label>
                    <input class="form-control" [(ngModel)]="form.host" placeholder="10.0.0.1"
                           style="font-family: monospace;">
                </div>
                <div class="form-group">
                    <label>Puerto API</label>
                    <input class="form-control" type="number" [(ngModel)]="form.apiPort" placeholder="8080">
                </div>
                <div class="form-group">
                    <label>Notas</label>
                    <textarea class="form-control" [(ngModel)]="form.notes" rows="2"
                              placeholder="Notas opcionales..."></textarea>
                </div>

                @if (formError) {
                    <div style="background: rgba(255,107,107,0.1); border: 1px solid rgba(255,107,107,0.3);
                                border-radius: 8px; padding: 12px; margin-bottom: 16px; color: var(--danger); font-size: 13px;">
                        {{ formError }}
                    </div>
                }

                <div class="modal-actions">
                    <button class="btn btn-secondary" (click)="closeForm()">Cancelar</button>
                    <button class="btn btn-primary" (click)="save()" [disabled]="!form.name || !form.host || saving">
                        {{ saving ? '⏳ Guardando...' : (editingId ? 'Guardar Cambios' : 'Crear Worker') }}
                    </button>
                </div>
            </div>
        </div>
    }

    <div class="stats-grid">
        @for (w of workers; track w.id) {
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div>
                        <h3 style="font-size: 16px;">{{ w.name }}</h3>
                        <span style="font-size: 12px; color: var(--text-muted); font-family: monospace;">{{ w.host }}:{{ w.apiPort }}</span>
                    </div>
                    <span class="badge" [class]="w.status === 'ONLINE' ? 'active' : (w.status === 'DEGRADED' ? 'suspended' : 'cancelled')">
                        {{ w.status === 'ONLINE' ? '🟢' : (w.status === 'DEGRADED' ? '🟡' : '🔴') }} {{ w.status }}
                    </span>
                </div>

                <div style="display: flex; gap: 20px; margin-bottom: 12px;">
                    <div>
                        <div style="font-size: 22px; font-weight: 700; color: var(--primary);">{{ w.activeJobs }}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">ACTIVOS</div>
                    </div>
                    <div>
                        <div style="font-size: 22px; font-weight: 700;">{{ w.totalProcessed }}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">PROCESADOS</div>
                    </div>
                    @if (w.cpuCores) {
                        <div>
                            <div style="font-size: 22px; font-weight: 700;">{{ w.cpuCores }}</div>
                            <div style="font-size: 11px; color: var(--text-muted);">CPU CORES</div>
                        </div>
                    }
                </div>

                @if (w.ramTotalMb && w.ramUsedMb) {
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">
                            RAM: {{ (w.ramUsedMb / 1024).toFixed(1) }} / {{ (w.ramTotalMb / 1024).toFixed(1) }} GB
                        </div>
                        <div style="height: 6px; background: var(--bg-secondary); border-radius: 3px; overflow: hidden;">
                            <div [style.width.%]="(w.ramUsedMb / w.ramTotalMb) * 100"
                                 style="height: 100%; border-radius: 3px; transition: width 0.3s;"
                                 [style.background]="w.ramUsedMb / w.ramTotalMb > 0.85 ? 'var(--danger)' : 'var(--success)'">
                            </div>
                        </div>
                    </div>
                }

                @if (w.lastHeartbeat) {
                    <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 8px;">
                        ⏱️ Último heartbeat: {{ formatTime(w.lastHeartbeat) }}
                    </div>
                }

                @if (liveStatus[w.id]) {
                    <div style="font-size: 12px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px;
                                background: rgba(0,210,211,0.05); border-radius: 8px; padding: 10px;">
                        <div style="font-weight: 600; margin-bottom: 4px;">📊 Live Status</div>
                        @if (liveStatus[w.id].system) {
                            <span>🖥️ {{ liveStatus[w.id].system.cpuModel }}</span>
                            <span>💾 {{ liveStatus[w.id].system.freeMemoryMb }} MB libre / {{ liveStatus[w.id].system.totalMemoryMb }} MB total</span>
                            <span>📈 Load: {{ liveStatus[w.id].system.loadAvg?.[0]?.toFixed(2) }}</span>
                        }
                        @if (liveStatus[w.id].matrices) {
                            @for (m of liveStatus[w.id].matrices; track m.matrixName) {
                                <span style="margin-top: 4px; font-weight: 600;">🧩 {{ m.matrixName }}: {{ m.activeJobs }} activos, {{ m.completedJobs }} completados, {{ m.failedJobs }} fallidos</span>
                            }
                        }
                    </div>
                }

                <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
                    <button class="btn btn-sm btn-secondary" (click)="pollStatus(w.id)" [disabled]="polling[w.id]">
                        {{ polling[w.id] ? '⏳' : '📊' }} Live Status
                    </button>
                    <button class="btn btn-sm btn-secondary" (click)="openEdit(w)">
                        ✏️ Editar
                    </button>
                    <button class="btn btn-sm btn-danger" style="margin-left: auto;" (click)="deleteWorker(w)"
                            [disabled]="deleting[w.id]">
                        {{ deleting[w.id] ? '⏳' : '🗑️' }} Eliminar
                    </button>
                </div>
            </div>
        }
    </div>

    @if (workers.length === 0 && !showForm) {
        <div class="empty">No hay workers registrados. Añade uno con el botón "➕ Nuevo Worker".</div>
    }
    `,
})
export class WorkersComponent implements OnInit {
    workers: any[] = [];
    liveStatus: Record<string, any> = {};
    polling: Record<string, boolean> = {};
    deleting: Record<string, boolean> = {};
    showForm = false;
    saving = false;
    formError = '';
    editingId: string | null = null;
    form = { name: '', host: '', apiPort: 8080, notes: '' };

    constructor(private api: ApiService) { }

    ngOnInit() { this.load(); }

    load() {
        this.api.getWorkers().subscribe(d => this.workers = d);
    }

    resetForm() {
        this.form = { name: '', host: '', apiPort: 8080, notes: '' };
        this.editingId = null;
        this.formError = '';
    }

    openCreate() {
        this.resetForm();
        this.showForm = true;
    }

    openEdit(w: any) {
        this.editingId = w.id;
        this.form = { name: w.name, host: w.host, apiPort: w.apiPort || 8080, notes: w.notes || '' };
        this.formError = '';
        this.showForm = true;
    }

    closeForm() {
        this.showForm = false;
        this.resetForm();
    }

    save() {
        this.saving = true;
        this.formError = '';
        const obs = this.editingId
            ? this.api.updateWorker(this.editingId, this.form)
            : this.api.createWorker(this.form);

        obs.subscribe({
            next: () => { this.saving = false; this.closeForm(); this.load(); },
            error: (err) => { this.saving = false; this.formError = err.error?.message || 'Error'; },
        });
    }

    deleteWorker(w: any) {
        if (!confirm(`¿Eliminar el worker "${w.name}" (${w.host})?`)) return;
        this.deleting[w.id] = true;
        this.api.deleteWorker(w.id).subscribe({
            next: () => { this.deleting[w.id] = false; this.load(); },
            error: () => { this.deleting[w.id] = false; },
        });
    }

    pollStatus(id: string) {
        this.polling[id] = true;
        this.api.getWorkerLiveStatus(id).subscribe({
            next: (data) => { this.liveStatus[id] = data; this.polling[id] = false; this.load(); },
            error: () => { this.polling[id] = false; },
        });
    }

    formatTime(iso: string): string {
        const d = new Date(iso);
        const now = new Date();
        const diff = Math.round((now.getTime() - d.getTime()) / 1000);
        if (diff < 60) return `hace ${diff}s`;
        if (diff < 3600) return `hace ${Math.round(diff / 60)}min`;
        return d.toLocaleString('es-ES');
    }
}
