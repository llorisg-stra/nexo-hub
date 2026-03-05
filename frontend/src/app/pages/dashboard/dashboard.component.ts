import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="page-header">
        <div>
            <h1>Dashboard</h1>
            <p>Resumen general del panel de control</p>
        </div>
        <a routerLink="/provision" class="btn btn-primary">🚀 Nueva Matriz</a>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon purple">👥</div>
            <div>
                <div class="stat-value">{{ clients.length }}</div>
                <div class="stat-label">Clientes</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon cyan">⬡</div>
            <div>
                <div class="stat-value">{{ activeMatrices }}</div>
                <div class="stat-label">Matrices Activas</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon green">🖥️</div>
            <div>
                <div class="stat-value">{{ vpsNodes.length }}</div>
                <div class="stat-label">Nodos VPS</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon orange">⚠️</div>
            <div>
                <div class="stat-value">{{ errorMatrices }}</div>
                <div class="stat-label">Con Errores</div>
            </div>
        </div>
    </div>

    <div class="card" style="margin-bottom: 20px;">
        <h3 style="margin-bottom: 16px;">Matrices Recientes</h3>
        @if (matrices.length === 0) {
            <div class="empty">No hay matrices provisionadas aún</div>
        } @else {
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Slug</th>
                            <th>Cliente</th>
                            <th>Estado</th>
                            <th>VPS</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        @for (m of matrices.slice(0, 10); track m.id) {
                            <tr>
                                <td><a [routerLink]="['/matrices', m.id]">{{ m.slug }}</a></td>
                                <td>{{ m.client?.name || '—' }}</td>
                                <td><span class="badge" [class]="m.status.toLowerCase()">{{ m.status }}</span></td>
                                <td>{{ m.vpsNode?.name || '—' }}</td>
                                <td>
                                    <a [routerLink]="['/matrices', m.id]" class="btn btn-sm btn-secondary">Ver</a>
                                </td>
                            </tr>
                        }
                    </tbody>
                </table>
            </div>
        }
    </div>
    `,
})
export class DashboardComponent implements OnInit {
    clients: any[] = [];
    vpsNodes: any[] = [];
    matrices: any[] = [];

    get activeMatrices() { return this.matrices.filter(m => m.status === 'ACTIVE').length; }
    get errorMatrices() { return this.matrices.filter(m => m.status === 'ERROR').length; }

    constructor(private api: ApiService) { }

    ngOnInit() {
        this.api.getClients().subscribe(d => this.clients = d);
        this.api.getVpsNodes().subscribe(d => this.vpsNodes = d);
        this.api.getMatrices().subscribe(d => this.matrices = d);
    }
}
