import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

const CATEGORIES = [
    { value: '', label: 'Todas' },
    { value: 'ventas', label: '💰 Ventas' },
    { value: 'operaciones', label: '⚙️ Operaciones' },
    { value: 'marketing', label: '📣 Marketing' },
    { value: 'soporte', label: '🎧 Soporte' },
    { value: 'datos', label: '📊 Datos' },
    { value: 'otro', label: '📦 Otro' },
];

@Component({
    selector: 'app-modules',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="page-header">
        <div>
            <h1>📦 Módulos</h1>
            <p>Catálogo de funcionalidades activables por Matriz</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">+ Nuevo Módulo</button>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon purple">📦</div>
            <div>
                <div class="stat-value">{{ modules.length }}</div>
                <div class="stat-label">Total</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon blue">🔒</div>
            <div>
                <div class="stat-value">{{ coreCount }}</div>
                <div class="stat-label">Core (fijos)</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon green">🧩</div>
            <div>
                <div class="stat-value">{{ optionalCount }}</div>
                <div class="stat-label">Opcionales</div>
            </div>
        </div>
    </div>

    <!-- Filter by category -->
    <div class="filter-tabs">
        @for (cat of categories; track cat.value) {
            <button class="filter-tab" [class.active]="filterCategory === cat.value"
                (click)="filterCategory = cat.value">
                {{ cat.label }}
            </button>
        }
    </div>

    <!-- Module Cards -->
    @if (loading) {
        <div class="loading"><div class="spinner"></div>Cargando módulos...</div>
    } @else if (filteredModules.length === 0) {
        <div class="empty">No hay módulos {{ filterCategory ? 'en esta categoría' : 'creados aún' }}</div>
    } @else {
        <div class="modules-grid">
            @for (mod of filteredModules; track mod.id) {
                <div class="module-card" [class.core]="mod.isCore">
                    <div class="module-card-header">
                        <div class="module-icon">{{ mod.icon || '📦' }}</div>
                        <div class="module-info">
                            <h3>{{ mod.name }}</h3>
                            <span class="module-slug">{{ mod.slug }}</span>
                        </div>
                        @if (mod.isCore) {
                            <span class="badge core">CORE</span>
                        } @else {
                            <span class="badge optional">OPCIONAL</span>
                        }
                    </div>
                    <p class="module-desc">{{ mod.description || 'Sin descripción' }}</p>
                    <div class="module-meta">
                        @if (mod.category) {
                            <span class="module-category">🏷️ {{ mod.category }}</span>
                        }
                        <span class="module-matrices">🏢 {{ mod.matrices?.length || 0 }} matrices</span>
                        <span class="module-version">v{{ mod.version }}</span>
                    </div>
                    <div class="module-actions">
                        <button class="btn btn-sm btn-secondary" (click)="openEditModal(mod)">✏️ Editar</button>
                        @if (!mod.isCore) {
                            <button class="btn btn-sm btn-danger" (click)="confirmDelete(mod)">🗑️</button>
                        }
                    </div>
                </div>
            }
        </div>
    }

    <!-- Create/Edit Modal -->
    @if (showModal) {
        <div class="modal-overlay" (click)="closeModal()">
            <div class="modal" (click)="$event.stopPropagation()">
                <h2>{{ editingModule ? '✏️ Editar Módulo' : '📦 Nuevo Módulo' }}</h2>
                @if (error) {
                    <div class="alert alert-error">{{ error }}</div>
                }
                <div class="form-group">
                    <label>Nombre *</label>
                    <input class="form-control" [(ngModel)]="form.name" placeholder="CRM">
                </div>
                <div class="form-group">
                    <label>Slug * <span class="hint">(identificador único, sin espacios)</span></label>
                    <input class="form-control" [(ngModel)]="form.slug" placeholder="crm"
                        [disabled]="!!editingModule">
                </div>
                <div class="form-group">
                    <label>Descripción</label>
                    <input class="form-control" [(ngModel)]="form.description"
                        placeholder="Gestión de contactos, pipeline de ventas, etc.">
                </div>
                <div class="form-row">
                    <div class="form-group flex-1">
                        <label>Icono</label>
                        <input class="form-control" [(ngModel)]="form.icon" placeholder="📦">
                    </div>
                    <div class="form-group flex-1">
                        <label>Categoría</label>
                        <select class="form-control" [(ngModel)]="form.category">
                            <option value="">Sin categoría</option>
                            @for (cat of categories.slice(1); track cat.value) {
                                <option [value]="cat.value">{{ cat.label }}</option>
                            }
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" [(ngModel)]="form.isCore">
                        Módulo Core (no se puede desactivar por Matriz)
                    </label>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
                    <button class="btn btn-primary" (click)="saveModule()"
                        [disabled]="!form.name || !form.slug">
                        {{ editingModule ? 'Guardar' : 'Crear' }}
                    </button>
                </div>
            </div>
        </div>
    }

    <!-- Delete Confirm Modal -->
    @if (showDeleteModal) {
        <div class="modal-overlay" (click)="showDeleteModal = false">
            <div class="modal" (click)="$event.stopPropagation()">
                <h2>⚠️ Eliminar Módulo</h2>
                <p>¿Eliminar <strong>{{ deletingModule?.name }}</strong>?</p>
                <p style="color: var(--text-muted); margin-top: 8px; font-size: 13px;">
                    Se desasignará de todas las matrices que lo tengan activo.
                </p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" (click)="showDeleteModal = false">Cancelar</button>
                    <button class="btn btn-danger" (click)="deleteModule()">Eliminar</button>
                </div>
            </div>
        </div>
    }
    `,
    styles: [`
        .filter-tabs {
            display: flex; gap: 4px; margin-bottom: 20px;
            background: var(--bg-secondary); border-radius: 10px;
            padding: 4px; border: 1px solid var(--border);
            flex-wrap: wrap;
        }
        .filter-tab {
            padding: 8px 14px; border: none; background: transparent;
            color: var(--text-secondary); font-size: 13px; font-weight: 500;
            font-family: var(--font); border-radius: 8px; cursor: pointer;
            transition: all 0.2s;
        }
        .filter-tab:hover { color: var(--text-primary); }
        .filter-tab.active { background: var(--accent); color: white; }

        .modules-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 16px;
        }
        .module-card {
            background: var(--bg-card); border: 1px solid var(--border);
            border-radius: var(--radius); padding: 20px; transition: all 0.2s;
        }
        .module-card:hover {
            border-color: rgba(108, 92, 231, 0.3);
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .module-card.core { border-left: 3px solid var(--accent); }

        .module-card-header {
            display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
        }
        .module-icon {
            width: 44px; height: 44px; border-radius: 10px;
            background: linear-gradient(135deg, var(--accent), var(--accent-light));
            display: flex; align-items: center; justify-content: center; font-size: 22px;
        }
        .module-info { flex: 1; }
        .module-info h3 { font-size: 16px; font-weight: 600; }
        .module-slug { font-size: 12px; color: var(--text-muted); font-family: monospace; }

        .badge.core { background: rgba(108, 92, 231, 0.15); color: var(--accent-light); }
        .badge.optional { background: rgba(0, 210, 211, 0.15); color: var(--success); }

        .module-desc {
            font-size: 13px; color: var(--text-secondary);
            margin-bottom: 12px; line-height: 1.5;
        }
        .module-meta {
            display: flex; gap: 16px; font-size: 12px;
            color: var(--text-muted); margin-bottom: 14px;
        }
        .module-actions {
            display: flex; gap: 8px; padding-top: 12px;
            border-top: 1px solid var(--border);
        }

        .form-row { display: flex; gap: 12px; }
        .flex-1 { flex: 1; }
        .hint { font-size: 11px; color: var(--text-muted); font-weight: 400; }
        .checkbox-label {
            display: flex; align-items: center; gap: 8px;
            font-size: 14px; cursor: pointer;
        }
        .checkbox-label input { width: 18px; height: 18px; }
        .alert-error {
            background: rgba(255,71,87,0.1); color: var(--danger);
            padding: 10px 14px; border-radius: 8px; margin-bottom: 16px;
            font-size: 13px;
        }
    `],
})
export class ModulesComponent implements OnInit {
    modules: any[] = [];
    loading = true;
    filterCategory = '';
    categories = CATEGORIES;

    showModal = false;
    showDeleteModal = false;
    editingModule: any = null;
    deletingModule: any = null;
    error = '';

    form = {
        name: '', slug: '', description: '', icon: '📦',
        category: '', isCore: false,
    };

    get coreCount() { return this.modules.filter(m => m.isCore).length; }
    get optionalCount() { return this.modules.filter(m => !m.isCore).length; }
    get filteredModules() {
        return this.filterCategory
            ? this.modules.filter(m => m.category === this.filterCategory)
            : this.modules;
    }

    constructor(private api: ApiService) { }

    ngOnInit() { this.loadModules(); }

    loadModules() {
        this.loading = true;
        this.api.getModules().subscribe({
            next: (data) => { this.modules = data; this.loading = false; },
            error: () => { this.loading = false; },
        });
    }

    openCreateModal() {
        this.editingModule = null;
        this.error = '';
        this.form = { name: '', slug: '', description: '', icon: '📦', category: '', isCore: false };
        this.showModal = true;
    }

    openEditModal(mod: any) {
        this.editingModule = mod;
        this.error = '';
        this.form = {
            name: mod.name, slug: mod.slug, description: mod.description || '',
            icon: mod.icon || '📦', category: mod.category || '', isCore: mod.isCore,
        };
        this.showModal = true;
    }

    closeModal() { this.showModal = false; this.editingModule = null; }

    saveModule() {
        this.error = '';
        if (this.editingModule) {
            const { slug, ...data } = this.form;
            this.api.updateModule(this.editingModule.id, data).subscribe({
                next: () => { this.closeModal(); this.loadModules(); },
                error: (err: any) => { this.error = err.error?.message || 'Error al guardar'; },
            });
        } else {
            this.api.createModule(this.form).subscribe({
                next: () => { this.closeModal(); this.loadModules(); },
                error: (err: any) => { this.error = err.error?.message || 'Error al crear'; },
            });
        }
    }

    confirmDelete(mod: any) {
        this.deletingModule = mod;
        this.showDeleteModal = true;
    }

    deleteModule() {
        if (!this.deletingModule) return;
        this.api.deleteModule(this.deletingModule.id).subscribe({
            next: () => {
                this.showDeleteModal = false;
                this.deletingModule = null;
                this.loadModules();
            },
        });
    }
}
