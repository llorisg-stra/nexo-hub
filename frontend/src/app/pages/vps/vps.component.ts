import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-vps',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="page-header">
        <div>
            <h1>Nodos VPS</h1>
            <p>Servidores de infraestructura y su estado</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">➕ Nuevo Nodo VPS</button>
    </div>

    @if (showForm) {
        <div class="modal-overlay" (click)="closeForm()">
            <div class="modal" (click)="$event.stopPropagation()">
                <h2>{{ editingNodeId ? '✏️ Editar Nodo VPS' : 'Nuevo Nodo VPS' }}</h2>
                <div class="form-group">
                    <label>Nombre *</label>
                    <input class="form-control" [(ngModel)]="form.name" placeholder="vps-produccion-01">
                </div>
                <div class="form-group">
                    <label>Host / IP *</label>
                    <input class="form-control" [(ngModel)]="form.host" placeholder="149.202.56.233"
                           style="font-family: monospace;">
                </div>
                <div class="form-group">
                    <label>SSH User</label>
                    <input class="form-control" [(ngModel)]="form.sshUser" placeholder="ubuntu">
                </div>
                <div class="form-group">
                    <label>SSH Password (para provisioning)</label>
                    <input class="form-control" type="password" [(ngModel)]="form.sshPassword"
                           placeholder="Contraseña SSH">
                </div>
                <div class="form-group">
                    <label>Proveedor</label>
                    <select class="form-control" [(ngModel)]="form.provider">
                        <option value="OVH">OVH</option>
                        <option value="HETZNER">Hetzner</option>
                        <option value="DIGITAL_OCEAN">DigitalOcean</option>
                        <option value="AWS">AWS</option>
                        <option value="OTHER">Otro</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Máx. Matrices</label>
                    <input class="form-control" type="number" [(ngModel)]="form.maxMatrices" placeholder="5">
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
                    <button class="btn btn-primary" (click)="saveNode()" [disabled]="!form.name || !form.host || saving">
                        {{ saving ? '⏳ Guardando...' : (editingNodeId ? 'Guardar Cambios' : 'Crear Nodo') }}
                    </button>
                </div>
            </div>
        </div>
    }

    <!-- OVH Discovery -->
    <div class="card" style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
                <h3 style="margin: 0;">☁️ Servidores OVH</h3>
                <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">VPS detectados en tu cuenta OVH</p>
            </div>
            <button class="btn btn-sm btn-secondary" (click)="loadOvhVps()" [disabled]="ovhLoading">
                {{ ovhLoading ? '⏳ Cargando...' : '🔄 Refrescar' }}
            </button>
        </div>

        @if (ovhLoading) {
            <div class="loading" style="padding: 20px;"><div class="spinner"></div>Consultando API OVH...</div>
        } @else if (ovhError) {
            <div style="padding: 16px; background: rgba(255,107,107,0.1); border-radius: 8px; font-size: 13px; color: var(--danger);">
                ⚠️ {{ ovhError }}
            </div>
        } @else if (ovhNodes.length > 0) {
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px;">
                @for (ovh of ovhNodes; track ovh.name) {
                    <div style="padding: 14px 16px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-secondary);">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                            <div>
                                <div style="font-weight: 600; font-size: 14px;">{{ ovh.displayName || ovh.name }}</div>
                                <div style="font-size: 11px; color: var(--text-muted); font-family: monospace; margin-top: 2px;">
                                    {{ ovh.ips?.[0] || '—' }}
                                </div>
                            </div>
                            <span class="badge" [class]="ovh.state === 'running' ? 'active' : 'suspended'"
                                  style="font-size: 10px;">
                                {{ ovh.state }}
                            </span>
                        </div>
                        <div style="font-size: 12px; color: var(--text-secondary); display: flex; gap: 12px; margin-bottom: 10px;">
                            <span>🧠 {{ ovh.model?.memory || 0 }} MB</span>
                            <span>🖥️ {{ ovh.model?.vcore || 0 }} vCPU</span>
                            <span>💾 {{ ovh.model?.disk || 0 }} GB</span>
                            <span>🌍 {{ ovh.zone || '—' }}</span>
                        </div>
                        @if (isOvhRegistered(ovh)) {
                            <span style="font-size: 12px; color: var(--success);">✅ Ya registrado</span>
                        } @else {
                            <button class="btn btn-sm btn-primary" (click)="importOvhNode(ovh)">
                                📥 Importar como Nodo
                            </button>
                        }
                    </div>
                }
            </div>
        } @else {
            <div style="text-align: center; padding: 16px; color: var(--text-muted); font-size: 13px;">
                Pulsa "🔄 Refrescar" para cargar los VPS de tu cuenta OVH
            </div>
        }
    </div>

    <div class="stats-grid">
        @for (node of nodes; track node.id) {
            <div class="card" style="cursor: pointer;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div>
                        <h3 style="font-size: 16px;">{{ node.name }}</h3>
                        <span style="font-size: 12px; color: var(--text-muted);">{{ node.host }}</span>
                        @if (node.provider) {
                            <span style="font-size: 11px; color: var(--text-muted); margin-left: 8px; opacity: 0.7;">· {{ node.provider }}</span>
                        }
                    </div>
                    <span class="badge" [class]="node.status === 'ACTIVE' ? 'active' : 'suspended'">
                        {{ node.status }}
                    </span>
                </div>

                <div style="display: flex; gap: 16px; margin-bottom: 12px;">
                    <div>
                        <div style="font-size: 20px; font-weight: 700;">{{ node.matrices?.length || 0 }}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">MATRICES</div>
                    </div>
                    <div>
                        <div style="font-size: 20px; font-weight: 700;">{{ node.maxMatrices }}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">MÁX</div>
                    </div>
                </div>

                <div style="height: 6px; background: var(--bg-secondary); border-radius: 3px; overflow: hidden; margin-bottom: 12px;">
                    <div [style.width.%]="(node.currentLoad / node.maxMatrices) * 100"
                         style="height: 100%; border-radius: 3px;"
                         [style.background]="node.currentLoad / node.maxMatrices > 0.8 ? 'var(--danger)' : 'var(--success)'">
                    </div>
                </div>

                @if (node.notes && !notesHasPassword(node.notes)) {
                    <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px; font-style: italic;">
                        📝 {{ node.notes }}
                    </div>
                }

                @if (stats[node.id]) {
                    <div style="font-size: 12px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px;">
                        <span>💾 Disco: {{ stats[node.id].disk }}</span>
                        <span>🧠 RAM: {{ stats[node.id].ram }}</span>
                        <span>🖥️ CPU Cores: {{ stats[node.id].cpuCores }}</span>
                        <span>⏱️ {{ stats[node.id].uptime }}</span>
                    </div>

                    @if (matrixStatsKeys(node.id).length > 0) {
                        <div style="margin-top: 8px; border-top: 1px solid var(--border); padding-top: 8px;">
                            <div style="font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px;">Consumo por Matriz</div>
                            @for (slug of matrixStatsKeys(node.id); track slug) {
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; border-radius: 6px; margin-bottom: 3px; font-size: 12px;"
                                     [style.background]="stats[node.id].matrixStats[slug].cpu > 50 ? 'rgba(255,107,107,0.1)' : 'rgba(0,210,211,0.05)'">
                                    <span style="font-weight: 600;">{{ slug }}</span>
                                    <span>
                                        <span [style.color]="stats[node.id].matrixStats[slug].cpu > 50 ? 'var(--danger)' : 'var(--success)'"
                                              style="font-weight: 600;">{{ stats[node.id].matrixStats[slug].cpu.toFixed(1) }}%</span>
                                        CPU · {{ stats[node.id].matrixStats[slug].ramMb.toFixed(0) }} MB RAM · {{ stats[node.id].matrixStats[slug].containers }} cont.
                                    </span>
                                </div>
                            }
                        </div>
                    }
                }

                <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
                    <button class="btn btn-sm btn-secondary" (click)="testConnection(node.id)">
                        {{ testing[node.id] ? '⏳' : '🔌' }} Test SSH
                    </button>
                    <button class="btn btn-sm btn-secondary" (click)="loadStats(node.id)">
                        📊 Stats
                    </button>
                    <button class="btn btn-sm btn-secondary" (click)="openEdit(node)">
                        ✏️ Editar
                    </button>
                    <button class="btn btn-sm btn-danger" style="margin-left: auto;" (click)="rebootVps(node)"
                            [disabled]="rebooting[node.id]">
                        {{ rebooting[node.id] ? '⏳ Reiniciando...' : '🔄 Reboot VPS' }}
                    </button>
                    <button class="btn btn-sm btn-danger" (click)="deleteNode(node)"
                            [disabled]="deleting[node.id]">
                        {{ deleting[node.id] ? '⏳' : '🗑️' }} Eliminar
                    </button>
                </div>

                @if (testResult[node.id] !== undefined) {
                    <div style="margin-top: 8px; font-size: 12px;"
                         [style.color]="testResult[node.id] ? 'var(--success)' : 'var(--danger)'">
                        {{ testResult[node.id] ? '✅ Conexión SSH OK' : '❌ Conexión fallida' }}
                    </div>
                }
            </div>
        }
    </div>

    @if (nodes.length === 0 && !showForm) {
        <div class="empty">No hay nodos VPS registrados</div>
    }
    `,
})
export class VpsComponent implements OnInit {
    nodes: any[] = [];
    stats: Record<string, any> = {};
    testing: Record<string, boolean> = {};
    testResult: Record<string, boolean | undefined> = {};
    deleting: Record<string, boolean> = {};
    rebooting: Record<string, boolean> = {};
    showForm = false;
    saving = false;
    formError = '';
    editingNodeId: string | null = null;
    form = { name: '', host: '', sshUser: 'ubuntu', sshPassword: '', provider: 'OVH', maxMatrices: 5, notes: '' };

    // OVH Discovery
    ovhNodes: any[] = [];
    ovhLoading = false;
    ovhError = '';

    constructor(private api: ApiService) { }

    ngOnInit() {
        this.load();
        this.loadOvhVps();
    }

    load() {
        this.api.getVpsNodes().subscribe(d => this.nodes = d);
    }

    loadOvhVps() {
        this.ovhLoading = true;
        this.ovhError = '';
        this.api.getOvhVps().subscribe({
            next: (data: any[]) => {
                this.ovhNodes = data;
                this.ovhLoading = false;
            },
            error: (err: any) => {
                this.ovhError = err.error?.message || 'Error al consultar OVH API';
                this.ovhLoading = false;
            },
        });
    }

    isOvhRegistered(ovh: any): boolean {
        const ip = ovh.ips?.[0];
        return this.nodes.some(n => n.host === ip || n.name === ovh.displayName);
    }

    importOvhNode(ovh: any) {
        this.resetForm();
        this.form.name = ovh.displayName || ovh.name;
        this.form.host = ovh.ips?.[0] || '';
        this.form.provider = 'OVH';
        this.form.notes = `OVH: ${ovh.model?.name || ''} · ${ovh.model?.vcore || 0} vCPU · ${ovh.model?.memory || 0} MB · ${ovh.zone || ''}`;
        this.showForm = true;
    }

    resetForm() {
        this.form = { name: '', host: '', sshUser: 'ubuntu', sshPassword: '', provider: 'OVH', maxMatrices: 5, notes: '' };
        this.editingNodeId = null;
        this.formError = '';
    }

    openCreate() {
        this.resetForm();
        this.showForm = true;
    }

    openEdit(node: any) {
        this.editingNodeId = node.id;
        this.form = {
            name: node.name || '',
            host: node.host || '',
            sshUser: node.sshUser || 'ubuntu',
            sshPassword: '',
            provider: node.provider || 'OVH',
            maxMatrices: node.maxMatrices || 5,
            notes: this.cleanNotes(node.notes || ''),
        };
        this.formError = '';
        this.showForm = true;
    }

    closeForm() {
        this.showForm = false;
        this.resetForm();
    }

    saveNode() {
        this.saving = true;
        this.formError = '';

        if (this.editingNodeId) {
            // EDIT mode — PATCH
            const data: any = {
                name: this.form.name,
                host: this.form.host,
                ip: this.form.host,
                sshUser: this.form.sshUser || 'ubuntu',
                maxMatrices: this.form.maxMatrices || 5,
                notes: this.form.notes,
            };
            if (this.form.sshPassword) {
                data.notes = `[SSH_PASS:${this.form.sshPassword}] ${data.notes || ''}`;
            }
            this.api.updateVpsNode(this.editingNodeId, data).subscribe({
                next: () => {
                    this.saving = false;
                    this.closeForm();
                    this.load();
                },
                error: (err) => {
                    this.saving = false;
                    this.formError = err.error?.message || err.message || 'Error al actualizar nodo';
                },
            });
        } else {
            // CREATE mode — POST
            const data: any = {
                name: this.form.name,
                host: this.form.host,
                ip: this.form.host,
                sshUser: this.form.sshUser || 'ubuntu',
                provider: this.form.provider,
                maxMatrices: this.form.maxMatrices || 5,
                notes: this.form.notes,
            };
            if (this.form.sshPassword) {
                data.notes = `[SSH_PASS:${this.form.sshPassword}] ${data.notes || ''}`;
            }
            this.api.createVpsNode(data).subscribe({
                next: () => {
                    this.saving = false;
                    this.closeForm();
                    this.load();
                },
                error: (err) => {
                    this.saving = false;
                    this.formError = err.error?.message || err.message || 'Error al crear nodo';
                },
            });
        }
    }

    deleteNode(node: any) {
        const activeCount = (node.matrices || []).length;
        if (activeCount > 0) {
            alert(`No se puede eliminar: el nodo tiene ${activeCount} matriz/matrices activa(s). Elimínalas o migrálalas primero.`);
            return;
        }
        if (!confirm(`¿Eliminar el nodo "${node.name}" (${node.host})? Esta acción no se puede deshacer.`)) return;

        this.deleting[node.id] = true;
        this.api.deleteVpsNode(node.id).subscribe({
            next: () => {
                this.deleting[node.id] = false;
                this.load();
            },
            error: (err) => {
                this.deleting[node.id] = false;
                alert(err.error?.message || 'Error al eliminar el nodo');
            },
        });
    }

    testConnection(id: string) {
        this.testing[id] = true;
        this.testResult[id] = undefined;
        this.api.testVpsConnection(id).subscribe({
            next: (r) => { this.testResult[id] = r.connected; this.testing[id] = false; },
            error: () => { this.testResult[id] = false; this.testing[id] = false; },
        });
    }

    loadStats(id: string) {
        this.api.getVpsStats(id).subscribe(s => this.stats[id] = s);
    }

    rebootVps(node: any) {
        if (!confirm(`¿Reiniciar el VPS "${node.name}" (${node.host})?\n\nLos contenedores se recuperarán automáticamente en ~1-2 minutos.`)) return;
        this.rebooting[node.id] = true;
        this.api.rebootVps(node.id).subscribe({
            next: (r) => {
                alert(r.message || 'Reboot enviado. El servidor volverá en ~1-2 minutos.');
                this.rebooting[node.id] = false;
            },
            error: (err) => {
                // SSH drop during reboot may cause an error — that's normal
                alert('Reboot enviado. El servidor volverá en ~1-2 minutos.');
                this.rebooting[node.id] = false;
            },
        });
    }

    matrixStatsKeys(nodeId: string): string[] {
        return Object.keys(this.stats[nodeId]?.matrixStats || {});
    }

    /** Remove SSH password from notes for display */
    cleanNotes(notes: string): string {
        return notes.replace(/\[SSH_PASS:\S+?\]\s*/g, '').trim();
    }

    notesHasPassword(notes: string): boolean {
        return /\[SSH_PASS:/.test(notes) && this.cleanNotes(notes) === '';
    }
}
