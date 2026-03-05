import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

const TYPE_OPTIONS = [
    { value: '', label: '🏷️ Todos', color: '' },
    { value: 'CHANNEL', label: '📱 Canales', color: '#6c5ce7' },
    { value: 'CONNECTOR', label: '🔗 Conectores', color: '#00b894' },
    { value: 'MODULE', label: '🧩 Módulos', color: '#fdcb6e' },
    { value: 'PLUGIN', label: '🔌 Plugins', color: '#e17055' },
    { value: 'SKILL', label: '🎯 Skills', color: '#0984e3' },
];

@Component({
    selector: 'app-extensiones',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="page">
        <div class="page-header">
            <div>
                <h1>📦 Extensiones</h1>
                <p class="subtitle">Catálogo unificado de canales, conectores, módulos, plugins y skills</p>
            </div>
            <button class="btn-primary" (click)="openCreateModal()">
                <span>➕</span> Nueva extensión
            </button>
        </div>

        <!-- Stats -->
        <div class="stats-bar">
            <div class="stat">
                <span class="stat-value">{{ packages.length }}</span>
                <span class="stat-label">Total</span>
            </div>
            @for (t of typeOptions; track t.value) {
                @if (t.value) {
                <div class="stat" [class.active]="filterType === t.value" (click)="setFilter(t.value)">
                    <span class="stat-value">{{ countByType(t.value) }}</span>
                    <span class="stat-label">{{ t.label }}</span>
                </div>
                }
            }
        </div>

        <!-- Filter chips -->
        <div class="filter-bar">
            @for (t of typeOptions; track t.value) {
            <button
                class="chip"
                [class.active]="filterType === t.value"
                (click)="setFilter(t.value)">
                {{ t.label }}
            </button>
            }
            <input class="search-input" placeholder="🔍 Buscar..." [(ngModel)]="searchQuery" (ngModelChange)="applyFilter()">
        </div>

        <!-- Loading -->
        @if (loading) {
        <div class="loading">
            <div class="spinner"></div>
            <span>Cargando extensiones...</span>
        </div>
        }

        <!-- Grid -->
        @if (!loading) {
        <div class="grid">
            @for (pkg of filteredPackages; track pkg.id) {
            <div class="card">
                <div class="card-header">
                    <span class="card-icon">{{ pkg.icon || getDefaultIcon(pkg.type) }}</span>
                    <div class="card-title-block">
                        <h3>{{ pkg.displayName }}</h3>
                        <span class="type-badge" [attr.data-type]="pkg.type">{{ pkg.type }}</span>
                    </div>
                </div>
                <p class="card-desc">{{ pkg.description || 'Sin descripción' }}</p>
                <div class="card-meta">
                    <span class="meta-item">📌 v{{ pkg.version }}</span>
                    <span class="meta-item">👤 {{ pkg.author }}</span>
                    @if (pkg.installations?.length) {
                    <span class="meta-item">🏭 {{ pkg.installations.length }} matrices</span>
                    }
                    @if (pkg.isCore) {
                    <span class="core-badge">CORE</span>
                    }
                    <button class="visibility-badge" [class.private]="pkg.visibility === 'PRIVATE'" (click)="toggleVisibility(pkg)">
                        {{ pkg.visibility === 'PRIVATE' ? '🔒 PRIVATE' : '🌐 PUBLIC' }}
                    </button>
                </div>
                @if (pkg.visibility === 'PRIVATE') {
                <div class="access-section">
                    <span class="access-label">Clientes autorizados:</span>
                    <div class="access-tags">
                        @for (ac of pkg.allowedClients || []; track ac.id) {
                        <span class="access-tag">
                            {{ ac.client?.name }}
                            <button class="tag-remove" (click)="removeClientAccess(pkg, ac.client.id)">✕</button>
                        </span>
                        }
                        <button class="btn-add-client" (click)="openAccessPicker(pkg)">➕</button>
                    </div>
                </div>
                }
                <div class="card-actions">
                    <button class="btn-sm btn-edit" (click)="openEditModal(pkg)">✏️ Editar</button>
                    <button class="btn-sm btn-delete" (click)="confirmDelete(pkg)">🗑️ Eliminar</button>
                </div>
            </div>
            }
            @if (filteredPackages.length === 0) {
            <div class="empty-state">
                <span class="empty-icon">📦</span>
                <h3>No hay extensiones</h3>
                <p>Crea una nueva extensión para empezar</p>
            </div>
            }
        </div>
        }

        <!-- Create/Edit Modal -->
        @if (showModal) {
        <div class="modal-overlay" (click)="closeModal()">
            <div class="modal" (click)="$event.stopPropagation()">
                <h2>{{ editingPackage ? 'Editar' : 'Nueva' }} Extensión</h2>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Nombre técnico</label>
                        <input [(ngModel)]="form.name" placeholder="canal-telegram" [disabled]="!!editingPackage">
                    </div>
                    <div class="form-group">
                        <label>Nombre visible</label>
                        <input [(ngModel)]="form.displayName" placeholder="Telegram">
                    </div>
                    <div class="form-group">
                        <label>Tipo</label>
                        <select [(ngModel)]="form.type" [disabled]="!!editingPackage">
                            <option value="CHANNEL">📱 Canal</option>
                            <option value="CONNECTOR">🔗 Conector</option>
                            <option value="MODULE">🧩 Módulo</option>
                            <option value="PLUGIN">🔌 Plugin</option>
                            <option value="SKILL">🎯 Skill</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>URL del repositorio</label>
                        <input [(ngModel)]="form.repoUrl" placeholder="https://github.com/org/repo">
                    </div>
                    <div class="form-group">
                        <label>Versión</label>
                        <input [(ngModel)]="form.version" placeholder="1.0.0">
                    </div>
                    <div class="form-group">
                        <label>Autor</label>
                        <input [(ngModel)]="form.author" placeholder="Estrategia Labs">
                    </div>
                    <div class="form-group">
                        <label>Icono (emoji)</label>
                        <input [(ngModel)]="form.icon" placeholder="📱">
                    </div>
                    <div class="form-group">
                        <label>Categoría</label>
                        <input [(ngModel)]="form.category" placeholder="comunicacion">
                    </div>
                    <div class="form-group full-width">
                        <label>Descripción</label>
                        <textarea [(ngModel)]="form.description" rows="3" placeholder="Descripción de la extensión..."></textarea>
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" [(ngModel)]="form.isCore">
                            Extensión Core (se instala automáticamente)
                        </label>
                    </div>
                    <div class="form-group">
                        <label>Visibilidad</label>
                        <select [(ngModel)]="form.visibility">
                            <option value="PUBLIC">🌐 Pública — visible para todos</option>
                            <option value="PRIVATE">🔒 Privada — solo clientes autorizados</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Modelo de precio</label>
                        <select [(ngModel)]="form.pricingModel">
                            <option value="FREE">✅ Gratis</option>
                            <option value="INCLUDED_IN_TIER">🎫 Incluida en tier</option>
                            <option value="MONTHLY">💳 Mensual</option>
                            <option value="ONE_TIME">💰 Pago único</option>
                        </select>
                    </div>
                    @if (form.pricingModel !== 'FREE') {
                    <div class="form-group">
                        <label>Precio (€)</label>
                        <input type="number" [(ngModel)]="form.price" min="0" step="0.01" placeholder="0.00">
                    </div>
                    }
                </div>
                @if (form.visibility === 'PRIVATE') {
                <div class="access-modal-section">
                    <label>Clientes con acceso:</label>
                    <div class="client-checkboxes">
                        @for (c of allClients; track c.id) {
                        <label class="client-check">
                            <input type="checkbox" [checked]="selectedClientIds.has(c.id)" (change)="toggleClientId(c.id)">
                            <span>👤 {{ c.name }}</span>
                            <span class="client-email">{{ c.email }}</span>
                        </label>
                        }
                        @if (allClients.length === 0) {
                        <span class="no-clients">No hay clientes registrados</span>
                        }
                    </div>
                </div>
                }
                @if (error) {
                <div class="error-msg">{{ error }}</div>
                }
                <div class="modal-actions">
                    <button class="btn-secondary" (click)="closeModal()">Cancelar</button>
                    <button class="btn-primary" (click)="savePackage()" [disabled]="saving">
                        {{ saving ? 'Guardando...' : (editingPackage ? 'Guardar' : 'Crear') }}
                    </button>
                </div>
            </div>
        </div>
        }

        <!-- Delete Confirmation Modal -->
        @if (showDeleteModal && deletingPackage) {
        <div class="modal-overlay" (click)="showDeleteModal = false">
            <div class="modal modal-sm" (click)="$event.stopPropagation()">
                <h2>⚠️ Eliminar extensión</h2>
                <p>¿Seguro que quieres eliminar <strong>{{ deletingPackage.displayName }}</strong>?</p>
                <p class="warning-text">Se desinstalará de todas las matrices donde esté instalada.</p>
                <div class="modal-actions">
                    <button class="btn-secondary" (click)="showDeleteModal = false">Cancelar</button>
                    <button class="btn-danger" (click)="deletePackage()">Eliminar</button>
                </div>
            </div>
        </div>
        }

        <!-- Access Picker Modal -->
        @if (showAccessPicker && accessTarget) {
        <div class="modal-overlay" (click)="showAccessPicker = false">
            <div class="modal modal-sm" (click)="$event.stopPropagation()">
                <h2>Autorizar clientes para {{ accessTarget.displayName }}</h2>
                <div class="client-list">
                    @for (c of availableClientsForAccess; track c.id) {
                    <button class="client-row" (click)="addClientAccess(c.id)">
                        <span>👤 {{ c.name }}</span>
                        <span class="client-email">{{ c.email }}</span>
                    </button>
                    }
                    @if (availableClientsForAccess.length === 0) {
                    <div class="empty-state" style="padding: 1rem;">Todos los clientes ya tienen acceso</div>
                    }
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" (click)="showAccessPicker = false">Cerrar</button>
                </div>
            </div>
        </div>
        }
    </div>
    `,
    styles: [`
        .page { padding: 2rem; max-width: 1400px; margin: 0 auto; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
        .page-header h1 { font-size: 1.8rem; margin: 0; color: #e8e8f0; }
        .subtitle { color: #8888a8; margin: 0.25rem 0 0; font-size: 0.9rem; }

        .btn-primary {
            background: linear-gradient(135deg, #6c5ce7, #a855f7);
            color: white; border: none; padding: 0.65rem 1.2rem; border-radius: 8px;
            cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 0.4rem;
            transition: transform 0.15s, box-shadow 0.15s;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(108,92,231,0.4); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        /* Stats */
        .stats-bar {
            display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;
        }
        .stat {
            background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
            border-radius: 10px; padding: 0.6rem 1.2rem; cursor: pointer;
            display: flex; flex-direction: column; align-items: center; min-width: 80px;
            transition: border-color 0.2s, background 0.2s;
        }
        .stat:hover { border-color: rgba(108,92,231,0.3); }
        .stat.active { border-color: #6c5ce7; background: rgba(108,92,231,0.1); }
        .stat-value { font-size: 1.3rem; font-weight: 700; color: #e8e8f0; }
        .stat-label { font-size: 0.7rem; color: #8888a8; margin-top: 2px; }

        /* Filters */
        .filter-bar { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: center; }
        .chip {
            padding: 0.4rem 0.8rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);
            background: transparent; color: #aaa; cursor: pointer; font-size: 0.8rem;
            transition: all 0.2s;
        }
        .chip:hover { border-color: #6c5ce7; color: #e8e8f0; }
        .chip.active { background: rgba(108,92,231,0.2); border-color: #6c5ce7; color: white; }
        .search-input {
            margin-left: auto; padding: 0.4rem 0.8rem; border-radius: 20px;
            border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04);
            color: #e8e8f0; font-size: 0.85rem; width: 200px; outline: none;
        }
        .search-input:focus { border-color: #6c5ce7; }

        /* Loading */
        .loading { display: flex; align-items: center; gap: 1rem; justify-content: center; padding: 3rem; color: #8888a8; }
        .spinner { width: 24px; height: 24px; border: 2px solid rgba(108,92,231,0.2); border-top-color: #6c5ce7; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Grid */
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; }

        .card {
            background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
            border-radius: 12px; padding: 1.2rem; transition: border-color 0.2s, transform 0.2s;
        }
        .card:hover { border-color: rgba(108,92,231,0.3); transform: translateY(-2px); }
        .card-header { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 0.6rem; }
        .card-icon { font-size: 2rem; }
        .card-title-block { flex: 1; }
        .card-title-block h3 { margin: 0; font-size: 1rem; color: #e8e8f0; }
        .type-badge {
            display: inline-block; font-size: 0.65rem; padding: 0.15rem 0.5rem; border-radius: 10px;
            font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .type-badge[data-type="CHANNEL"] { background: rgba(108,92,231,0.2); color: #a78bfa; }
        .type-badge[data-type="CONNECTOR"] { background: rgba(0,184,148,0.2); color: #6ee7b7; }
        .type-badge[data-type="MODULE"] { background: rgba(253,203,110,0.2); color: #fcd34d; }
        .type-badge[data-type="PLUGIN"] { background: rgba(225,112,85,0.2); color: #fb923c; }
        .type-badge[data-type="SKILL"] { background: rgba(9,132,227,0.2); color: #60a5fa; }
        .card-desc { color: #8888a8; font-size: 0.85rem; margin: 0.4rem 0 0.6rem; line-height: 1.4; }
        .card-meta { display: flex; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 0.8rem; }
        .meta-item { font-size: 0.75rem; color: #6b6b8a; }
        .core-badge { font-size: 0.65rem; padding: 0.1rem 0.4rem; border-radius: 6px; background: rgba(108,92,231,0.3); color: #a78bfa; font-weight: 700; }
        .card-actions { display: flex; gap: 0.5rem; }
        .btn-sm {
            padding: 0.3rem 0.7rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08);
            background: transparent; color: #aaa; cursor: pointer; font-size: 0.8rem;
            transition: all 0.15s;
        }
        .btn-edit:hover { border-color: #6c5ce7; color: #a78bfa; }
        .btn-delete:hover { border-color: #e74c3c; color: #e74c3c; }

        /* Empty State */
        .empty-state {
            grid-column: 1 / -1; text-align: center; padding: 3rem;
            color: #6b6b8a;
        }
        .empty-icon { font-size: 3rem; display: block; margin-bottom: 0.5rem; }
        .empty-state h3 { color: #8888a8; margin: 0.5rem 0; }

        /* Modal */
        .modal-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100;
            display: flex; align-items: center; justify-content: center;
        }
        .modal {
            background: #1a1a2e; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
            padding: 2rem; width: 90%; max-width: 680px; max-height: 90vh; overflow-y: auto;
        }
        .modal-sm { max-width: 440px; }
        .modal h2 { margin: 0 0 1.2rem; color: #e8e8f0; font-size: 1.2rem; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.3rem; }
        .form-group.full-width { grid-column: 1 / -1; }
        .form-group label { font-size: 0.8rem; color: #8888a8; font-weight: 500; }
        .form-group input, .form-group select, .form-group textarea {
            padding: 0.5rem 0.7rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
            background: rgba(255,255,255,0.04); color: #e8e8f0; font-size: 0.9rem; outline: none;
            font-family: inherit;
        }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
            border-color: #6c5ce7;
        }
        .form-group input:disabled { opacity: 0.5; }
        .checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding-top: 0.5rem; }
        .checkbox-label input[type="checkbox"] { accent-color: #6c5ce7; }
        .error-msg { color: #e74c3c; font-size: 0.85rem; margin-top: 0.5rem; padding: 0.5rem; background: rgba(231,76,60,0.1); border-radius: 6px; }
        .warning-text { color: #e17055; font-size: 0.85rem; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem; }
        .btn-secondary {
            padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
            background: transparent; color: #aaa; cursor: pointer;
        }
        .btn-danger {
            padding: 0.5rem 1rem; border-radius: 8px; border: none;
            background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; cursor: pointer;
        }

        /* Visibility badge */
        .visibility-badge {
            font-size: 0.65rem; padding: 0.1rem 0.5rem; border-radius: 6px;
            background: rgba(0,210,211,0.15); color: #00d2d3; font-weight: 700;
            border: 1px solid rgba(0,210,211,0.2); cursor: pointer; transition: all 0.2s;
        }
        .visibility-badge:hover { transform: scale(1.05); }
        .visibility-badge.private { background: rgba(231,76,60,0.15); color: #e74c3c; border-color: rgba(231,76,60,0.2); }
        .access-section { margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.05); }
        .access-label { font-size: 0.7rem; color: #6b6b8a; }
        .access-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
        .access-tag {
            display: flex; align-items: center; gap: 4px;
            font-size: 0.7rem; padding: 2px 8px; border-radius: 12px;
            background: rgba(108,92,231,0.15); color: #a78bfa;
        }
        .tag-remove {
            background: none; border: none; color: #e74c3c; cursor: pointer;
            font-size: 0.7rem; padding: 0; line-height: 1;
        }
        .btn-add-client {
            background: rgba(255,255,255,0.04); border: 1px dashed rgba(255,255,255,0.15);
            border-radius: 12px; padding: 2px 8px; font-size: 0.7rem; color: #8888a8;
            cursor: pointer; transition: all 0.2s;
        }
        .btn-add-client:hover { border-color: #6c5ce7; color: #a78bfa; }
        .client-list { display: flex; flex-direction: column; gap: 4px; max-height: 300px; overflow-y: auto; }
        .client-row {
            display: flex; justify-content: space-between; align-items: center;
            padding: 8px 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
            border-radius: 8px; cursor: pointer; color: #e8e8f0; font-size: 0.85rem; transition: all 0.15s;
        }
        .client-row:hover { border-color: #6c5ce7; background: rgba(108,92,231,0.1); }
        .client-email { font-size: 0.75rem; color: #6b6b8a; }

        /* Client checkboxes in modal */
        .access-modal-section {
            margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.06);
        }
        .access-modal-section > label { font-size: 0.85rem; color: #8888a8; font-weight: 600; display: block; margin-bottom: 0.5rem; }
        .client-checkboxes { display: flex; flex-direction: column; gap: 6px; max-height: 200px; overflow-y: auto; }
        .client-check {
            display: flex; align-items: center; gap: 8px; padding: 6px 10px;
            background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
            border-radius: 8px; cursor: pointer; transition: all 0.15s; font-size: 0.85rem; color: #e8e8f0;
        }
        .client-check:hover { border-color: rgba(108,92,231,0.3); background: rgba(108,92,231,0.05); }
        .client-check input[type="checkbox"] { accent-color: #6c5ce7; }
        .no-clients { font-size: 0.8rem; color: #6b6b8a; padding: 0.5rem; }
    `],
})
export class ExtensionesComponent implements OnInit {
    packages: any[] = [];
    filteredPackages: any[] = [];
    loading = true;
    filterType = '';
    searchQuery = '';
    typeOptions = TYPE_OPTIONS;

    // Modal
    showModal = false;
    showDeleteModal = false;
    editingPackage: any = null;
    deletingPackage: any = null;
    saving = false;
    error = '';
    form = {
        name: '', displayName: '', type: 'CHANNEL', repoUrl: '',
        version: '1.0.0', description: '', icon: '', author: 'Estrategia Labs',
        category: '', isCore: false, visibility: 'PUBLIC' as string,
        pricingModel: 'FREE' as string, price: 0,
    };

    // Visibility & Access
    allClients: any[] = [];
    showAccessPicker = false;
    accessTarget: any = null;
    selectedClientIds = new Set<string>();

    constructor(private api: ApiService) { }

    ngOnInit() {
        this.loadPackages();
        this.api.getClients().subscribe({ next: (c) => this.allClients = c });
    }

    loadPackages() {
        this.loading = true;
        this.api.getPackages(this.filterType || undefined).subscribe({
            next: (data) => { this.packages = data; this.applyFilter(); this.loading = false; },
            error: () => { this.loading = false; },
        });
    }

    setFilter(type: string) {
        this.filterType = this.filterType === type ? '' : type;
        this.loadPackages();
    }

    applyFilter() {
        let result = this.packages;
        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            result = result.filter(p =>
                p.displayName.toLowerCase().includes(q) ||
                p.name.toLowerCase().includes(q) ||
                (p.description || '').toLowerCase().includes(q)
            );
        }
        this.filteredPackages = result;
    }

    countByType(type: string): number {
        return this.packages.filter(p => p.type === type).length;
    }

    getDefaultIcon(type: string): string {
        switch (type) {
            case 'CHANNEL': return '📱';
            case 'CONNECTOR': return '🔗';
            case 'MODULE': return '🧩';
            case 'PLUGIN': return '🔌';
            case 'SKILL': return '🎯';
            default: return '📦';
        }
    }

    openCreateModal() {
        this.editingPackage = null;
        this.form = { name: '', displayName: '', type: 'CHANNEL', repoUrl: '', version: '1.0.0', description: '', icon: '', author: 'Estrategia Labs', category: '', isCore: false, visibility: 'PUBLIC', pricingModel: 'FREE', price: 0 };
        this.selectedClientIds = new Set();
        this.error = '';
        this.showModal = true;
    }

    openEditModal(pkg: any) {
        this.editingPackage = pkg;
        this.form = { name: pkg.name, displayName: pkg.displayName, type: pkg.type, repoUrl: pkg.repoUrl, version: pkg.version, description: pkg.description || '', icon: pkg.icon || '', author: pkg.author, category: pkg.category || '', isCore: pkg.isCore, visibility: pkg.visibility || 'PUBLIC', pricingModel: pkg.pricingModel || 'FREE', price: Number(pkg.price) || 0 };
        this.selectedClientIds = new Set((pkg.allowedClients || []).map((a: any) => a.client?.id || a.clientId));
        this.error = '';
        this.showModal = true;
    }

    closeModal() { this.showModal = false; this.editingPackage = null; }

    savePackage() {
        this.saving = true;
        this.error = '';
        let payload: any = { ...this.form };
        if (this.editingPackage) {
            // UpdatePackageDto doesn't accept name/type
            delete payload.name;
            delete payload.type;
        }
        const obs = this.editingPackage
            ? this.api.updatePackage(this.editingPackage.id, payload)
            : this.api.createPackage(payload);

        obs.subscribe({
            next: (result: any) => {
                // If PRIVATE, save access list too
                if (payload.visibility === 'PRIVATE' && this.editingPackage) {
                    this.api.setPackageAccess(this.editingPackage.id, [...this.selectedClientIds]).subscribe({
                        next: () => { this.saving = false; this.closeModal(); this.loadPackages(); },
                        error: () => { this.saving = false; this.closeModal(); this.loadPackages(); },
                    });
                } else {
                    this.saving = false; this.closeModal(); this.loadPackages();
                }
            },
            error: (err: any) => { this.saving = false; this.error = err.error?.message || 'Error al guardar'; },
        });
    }

    confirmDelete(pkg: any) {
        this.deletingPackage = pkg;
        this.showDeleteModal = true;
    }

    deletePackage() {
        if (!this.deletingPackage) return;
        this.api.deletePackage(this.deletingPackage.id).subscribe({
            next: () => { this.showDeleteModal = false; this.deletingPackage = null; this.loadPackages(); },
        });
    }

    // ── Visibility ──────────────────────────────────

    toggleVisibility(pkg: any) {
        const newVis = pkg.visibility === 'PRIVATE' ? 'PUBLIC' : 'PRIVATE';
        this.api.updatePackage(pkg.id, { visibility: newVis }).subscribe({
            next: () => {
                pkg.visibility = newVis;
                if (newVis === 'PUBLIC') {
                    pkg.allowedClients = [];
                }
            },
        });
    }

    toggleClientId(id: string) {
        if (this.selectedClientIds.has(id)) {
            this.selectedClientIds.delete(id);
        } else {
            this.selectedClientIds.add(id);
        }
    }

    get availableClientsForAccess(): any[] {
        if (!this.accessTarget) return [];
        const existing = new Set((this.accessTarget.allowedClients || []).map((a: any) => a.client?.id || a.clientId));
        return this.allClients.filter(c => !existing.has(c.id));
    }

    openAccessPicker(pkg: any) {
        this.accessTarget = pkg;
        this.showAccessPicker = true;
    }

    addClientAccess(clientId: string) {
        if (!this.accessTarget) return;
        const currentIds = (this.accessTarget.allowedClients || []).map((a: any) => a.client?.id || a.clientId);
        this.api.setPackageAccess(this.accessTarget.id, [...currentIds, clientId]).subscribe({
            next: () => { this.loadPackages(); this.showAccessPicker = false; },
        });
    }

    removeClientAccess(pkg: any, clientId: string) {
        const currentIds = (pkg.allowedClients || []).map((a: any) => a.client?.id || a.clientId);
        const filtered = currentIds.filter((id: string) => id !== clientId);
        this.api.setPackageAccess(pkg.id, filtered).subscribe({
            next: () => { this.loadPackages(); },
        });
    }
}
