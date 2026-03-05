import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-audit',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="page-header">
        <div>
            <h1>📋 Auditoría</h1>
            <p>Registro de todas las acciones del panel</p>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
            <span style="color: var(--text-muted); font-size: 13px;" *ngIf="total > 0">{{ total }} registros</span>
            <button class="btn btn-secondary btn-sm" (click)="load()" title="Refrescar">🔄</button>
        </div>
    </div>

    <!-- Filters -->
    <div style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 140px;">
            <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Acción</label>
            <select class="form-control" [(ngModel)]="filterAction" (change)="load()">
                <option value="">Todas</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="PROVISION">PROVISION</option>
                <option value="SUSPEND">SUSPEND</option>
                <option value="CREATE_FAILED">CREATE_FAILED</option>
                <option value="UPDATE_FAILED">UPDATE_FAILED</option>
                <option value="DELETE_FAILED">DELETE_FAILED</option>
            </select>
        </div>
        <div style="flex: 1; min-width: 140px;">
            <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Entidad</label>
            <select class="form-control" [(ngModel)]="filterEntity" (change)="load()">
                <option value="">Todas</option>
                <option value="client">Cliente</option>
                <option value="matrix">Matriz</option>
                <option value="vpsNode">Nodo VPS</option>
                <option value="plugin">Plugin</option>
                <option value="matrix/one-click">Provisioning</option>
            </select>
        </div>
    </div>

    <!-- Table -->
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th style="width: 160px;">Fecha</th>
                    <th style="width: 120px;">Acción</th>
                    <th style="width: 120px;">Entidad</th>
                    <th style="width: 260px;">ID</th>
                    <th>Detalles</th>
                    <th style="width: 120px;">IP</th>
                </tr>
            </thead>
            <tbody>
                @for (log of logs; track log.id) {
                    <tr>
                        <td style="font-size: 12px; color: var(--text-muted); white-space: nowrap;">{{ formatDate(log.createdAt) }}</td>
                        <td>
                            <span class="badge" [ngClass]="actionClass(log.action)">{{ log.action }}</span>
                        </td>
                        <td style="font-weight: 500;">{{ log.entity }}</td>
                        <td style="font-size: 11px; font-family: monospace; color: var(--text-muted);">{{ log.entityId || '—' }}</td>
                        <td>
                            @if (log.details) {
                                <button class="btn btn-sm btn-secondary" (click)="toggleDetails(log.id)"
                                        style="font-size: 11px; padding: 2px 8px;">
                                    {{ expandedId === log.id ? '▼ Ocultar' : '▶ Ver' }}
                                </button>
                                @if (expandedId === log.id) {
                                    <pre style="margin-top: 8px; font-size: 11px; white-space: pre-wrap; word-break: break-all;
                                                background: rgba(255,255,255,0.03); border-radius: 6px; padding: 8px;
                                                max-height: 200px; overflow-y: auto;">{{ log.details | json }}</pre>
                                }
                            } @else {
                                <span style="color: var(--text-muted);">—</span>
                            }
                        </td>
                        <td style="font-size: 12px; font-family: monospace; color: var(--text-muted);">{{ log.ip || '—' }}</td>
                    </tr>
                } @empty {
                    <tr><td colspan="6" class="empty">No hay registros de auditoría</td></tr>
                }
            </tbody>
        </table>
    </div>

    <!-- Pagination -->
    @if (total > limit) {
        <div style="display: flex; justify-content: center; gap: 12px; margin-top: 16px; align-items: center;">
            <button class="btn btn-secondary btn-sm" (click)="prevPage()" [disabled]="offset === 0">← Anterior</button>
            <span style="font-size: 13px; color: var(--text-muted);">
                {{ offset + 1 }}–{{ min(offset + limit, total) }} de {{ total }}
            </span>
            <button class="btn btn-secondary btn-sm" (click)="nextPage()" [disabled]="offset + limit >= total">Siguiente →</button>
        </div>
    }
    `,
    styles: [`
        pre { color: var(--text); }
        .badge.create { background: rgba(76,175,80,0.15); color: #66bb6a; }
        .badge.update { background: rgba(66,165,245,0.15); color: #42a5f5; }
        .badge.delete { background: rgba(255,107,107,0.15); color: #ff6b6b; }
        .badge.provision { background: rgba(171,71,188,0.15); color: #ab47bc; }
        .badge.suspend { background: rgba(255,167,38,0.15); color: #ffa726; }
        .badge.failed { background: rgba(255,107,107,0.2); color: #ff5252; }
        .badge.default { background: rgba(255,255,255,0.08); color: var(--text-muted); }
    `],
})
export class AuditComponent implements OnInit {
    logs: any[] = [];
    total = 0;
    limit = 50;
    offset = 0;
    filterAction = '';
    filterEntity = '';
    expandedId: string | null = null;

    constructor(private api: ApiService) { }

    ngOnInit() { this.load(); }

    load() {
        this.api.getAuditLogs({
            action: this.filterAction || undefined,
            entity: this.filterEntity || undefined,
            limit: this.limit,
            offset: this.offset,
        }).subscribe((res: any) => {
            this.logs = res.data;
            this.total = res.total;
        });
    }

    formatDate(iso: string): string {
        return new Date(iso).toLocaleString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
    }

    actionClass(action: string): string {
        const a = action.toLowerCase();
        if (a.includes('fail')) return 'failed';
        if (a.includes('create') || a.includes('provision')) return a.includes('provision') ? 'provision' : 'create';
        if (a.includes('update')) return 'update';
        if (a.includes('delete')) return 'delete';
        if (a.includes('suspend')) return 'suspend';
        return 'default';
    }

    toggleDetails(id: string) {
        this.expandedId = this.expandedId === id ? null : id;
    }

    prevPage() { this.offset = Math.max(0, this.offset - this.limit); this.load(); }
    nextPage() { this.offset += this.limit; this.load(); }
    min(a: number, b: number) { return Math.min(a, b); }
}
