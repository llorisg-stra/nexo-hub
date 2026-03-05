import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-matrix-detail',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    @if (loading) {
        <div class="loading"><div class="spinner"></div>Cargando matriz...</div>
    } @else if (matrix) {
        <!-- Updating overlay -->
        @if (updating) {
            <div class="update-overlay">
                <div class="update-card">
                    <div class="update-spinner"></div>
                    <h2>Actualizando {{ matrix.slug }}...</h2>
                    <p>Git pull, Docker build y restart en curso</p>
                    <div class="update-progress">
                        <div class="update-progress-bar"></div>
                    </div>
                    <div class="update-elapsed">
                        ⏱️ {{ updateElapsed }}s — puede tardar 3-5 minutos
                    </div>
                </div>
            </div>
        }

        <div class="page-header">
            <div>
                <h1>{{ matrix.slug }}</h1>
                <p>
                    <a [href]="'https://' + matrix.subdomain" target="_blank" style="color: var(--accent-light);">
                        🔗 {{ matrix.subdomain }}
                    </a>
                </p>
            </div>
            <div style="display: flex; gap: 8px;">
                @if (matrix.status === 'ACTIVE' || matrix.status === 'ERROR') {
                    <button class="btn btn-secondary" (click)="action('update')" [disabled]="updating">🔄 Actualizar</button>
                }
                @if (matrix.status === 'ACTIVE') {
                    <button class="btn btn-secondary" (click)="action('suspend')">⏸️ Suspender</button>
                }
                @if (matrix.status === 'SUSPENDED') {
                    <button class="btn btn-primary" (click)="action('reactivate')">▶️ Reactivar</button>
                }
                @if (matrix.status === 'ERROR') {
                    <button class="btn btn-primary" (click)="action('reactivate')">▶️ Reactivar</button>
                }
                @if (matrix.status === 'UPDATING') {
                    <button class="btn btn-secondary" disabled>⏳ Actualizando...</button>
                }
                <button class="btn btn-danger" (click)="action('delete')">🗑️ Eliminar</button>
            </div>
        </div>

        <!-- Status & Info -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon" [class]="statusIconClass">⬡</div>
                <div>
                    <div class="stat-value" style="font-size: 18px;">
                        <span class="badge" [class]="matrix.status.toLowerCase()">{{ matrix.status }}</span>
                    </div>
                    <div class="stat-label">Estado</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon cyan">🖥️</div>
                <div>
                    <div class="stat-value" style="font-size: 18px;">{{ matrix.vpsNode?.name || '—' }}</div>
                    <div class="stat-label">Nodo VPS</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">🔌</div>
                <div>
                    <div class="stat-value" style="font-size: 18px;">Slot {{ matrix.slotIndex }}</div>
                    <div class="stat-label">Puertos {{ matrix.portBackend }}-{{ matrix.portAdminer }}</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple">📦</div>
                <div>
                    <div class="stat-value" style="font-size: 16px; font-family: monospace;">{{ matrix.gitCommit || '—' }}</div>
                    <div class="stat-label">Git Commit</div>
                </div>
            </div>
        </div>

        <!-- Modules Section -->
        <div class="card modules-section">
            <div class="card-header">
                <h3>🧩 Módulos Activos</h3>
                <div style="display: flex; gap: 8px; align-items: center;">
                    @if (modulesDirty) {
                        <button class="btn btn-primary btn-sm" (click)="saveModules()" [disabled]="savingModules">
                            {{ savingModules ? 'Guardando...' : '💾 Guardar cambios' }}
                        </button>
                    }
                    @if (availableToAdd.length > 0) {
                        <div class="add-module-dropdown">
                            <button class="btn btn-secondary btn-sm" (click)="showAddMenu = !showAddMenu">
                                ➕ Añadir módulo
                            </button>
                            @if (showAddMenu) {
                                <div class="dropdown-menu">
                                    @for (mod of availableToAdd; track mod.id) {
                                        <button class="dropdown-item" (click)="addModule(mod)">
                                            <span>{{ mod.icon || '📦' }}</span>
                                            <span>{{ mod.name }}</span>
                                            @if (mod.category) {
                                                <span class="badge-mini cat">{{ mod.category }}</span>
                                            }
                                        </button>
                                    }
                                </div>
                            }
                        </div>
                    }
                </div>
            </div>
            @if (modulesLoading) {
                <div class="loading-sm"><div class="spinner-sm"></div>Cargando módulos...</div>
            } @else {
                <div class="modules-list">
                    @for (mod of visibleModules; track mod.id) {
                        <label class="module-toggle" [class.core]="mod.isCore" [class.active]="isModuleActive(mod.slug)">
                            <div class="module-toggle-info">
                                <span class="module-toggle-icon">{{ mod.icon || '📦' }}</span>
                                <div>
                                    <span class="module-toggle-name">{{ mod.name }}</span>
                                    @if (mod.isCore) {
                                        <span class="badge-mini core">CORE</span>
                                    }
                                    @if (mod.category) {
                                        <span class="badge-mini cat">{{ mod.category }}</span>
                                    }
                                </div>
                            </div>
                            <div class="toggle-switch">
                                <input type="checkbox"
                                    [checked]="isModuleActive(mod.slug)"
                                    [disabled]="mod.isCore"
                                    (change)="toggleModule(mod.slug, $event)">
                                <span class="toggle-slider" [class.disabled]="mod.isCore"></span>
                            </div>
                        </label>
                    }
                </div>
                @if (visibleModules.length === 0) {
                    <div class="empty-modules">No hay módulos asignados. Usa "➕ Añadir módulo" para asignar uno.</div>
                }
                @if (moduleSaveMessage) {
                    <div class="save-message" [class.error]="moduleSaveError">{{ moduleSaveMessage }}</div>
                }
            }
        </div>

        <!-- Extensions Section -->
        <div class="card extensions-section">
            <div class="card-header">
                <h3>📦 Extensiones Instaladas</h3>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <button class="btn btn-secondary btn-sm" (click)="showExtPicker = true">➕ Añadir extensión</button>
                </div>
            </div>
            @if (extensionsLoading) {
                <div class="loading-sm"><div class="spinner-sm"></div>Cargando extensiones...</div>
            } @else {
                <div class="modules-list">
                    @for (mp of matrixPackages; track mp.id) {
                    <div class="ext-card" [class.error]="mp.status === 'error'" [class.updating]="mp.status === 'updating'">
                        <div class="module-toggle-info">
                            <span class="module-toggle-icon">{{ mp.package?.icon || getExtIcon(mp.package?.type) }}</span>
                            <div>
                                <span class="module-toggle-name">{{ mp.package?.displayName }}</span>
                                <span class="badge-mini" [attr.data-type]="mp.package?.type">
                                    {{ mp.package?.type }}
                                </span>
                            </div>
                        </div>
                        <div class="ext-meta">
                            <span class="ext-version">v{{ mp.version }}</span>
                            <span class="ext-status" [class]="mp.status">{{ mp.status }}</span>
                        </div>
                        <div class="ext-actions">
                            <button class="btn-icon" title="Actualizar" (click)="updateExt(mp)" [disabled]="mp.status === 'updating'">
                                🔄
                            </button>
                            <button class="btn-icon btn-icon-danger" title="Desinstalar" (click)="uninstallExt(mp)">
                                🗑️
                            </button>
                        </div>
                    </div>
                    }
                </div>
                @if (matrixPackages.length === 0) {
                    <div class="empty-modules">No hay extensiones instaladas. Usa "➕ Añadir extensión" para instalar una.</div>
                }
                @if (extMessage) {
                    <div class="save-message" [class.error]="extError">{{ extMessage }}</div>
                }
            }
        </div>

        <!-- Extension Picker Modal -->
        @if (showExtPicker) {
        <div class="modal-overlay" (click)="showExtPicker = false">
            <div class="modal" (click)="$event.stopPropagation()">
                <h2>Añadir extensión a {{ matrix.slug }}</h2>
                <input class="ext-search" placeholder="🔍 Buscar extensión..." [(ngModel)]="extSearch">
                <div class="ext-picker-list">
                    @for (pkg of availableExtensions; track pkg.id) {
                    <div class="ext-picker-item">
                        <span class="module-toggle-icon">{{ pkg.icon || getExtIcon(pkg.type) }}</span>
                        <div class="ext-picker-info">
                            <span class="module-toggle-name">{{ pkg.displayName }}</span>
                            <span class="badge-mini" [attr.data-type]="pkg.type">{{ pkg.type }}</span>
                            <div class="ext-picker-desc">{{ pkg.description || '—' }}</div>
                        </div>
                        <button class="btn btn-primary btn-sm" (click)="installExt(pkg)" [disabled]="installingId === pkg.id">
                            {{ installingId === pkg.id ? '⏳' : '📥 Instalar' }}
                        </button>
                    </div>
                    }
                    @if (availableExtensions.length === 0) {
                        <div class="empty-modules">Todas las extensiones ya están instaladas.</div>
                    }
                </div>
                <div style="text-align: right; margin-top: 12px;">
                    <button class="btn btn-secondary" (click)="showExtPicker = false">Cerrar</button>
                </div>
            </div>
        </div>
        }

        <!-- Provisioning Events -->
        <div class="card">
            <h3 style="margin-bottom: 16px;">Pipeline de Provisioning</h3>
            <ul class="step-list">
                @for (ev of matrix.events || []; track ev.id) {
                    <li class="step-item">
                        <div class="step-dot" [class]="ev.status.toLowerCase()"></div>
                        <span class="step-name">{{ ev.step }}</span>
                        <span class="step-time">
                            @if (ev.durationMs) { {{ ev.durationMs }}ms }
                        </span>
                        @if (ev.message) {
                            <span style="font-size: 12px; color: var(--text-muted); max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                {{ ev.message }}
                            </span>
                        }
                    </li>
                }
                @if (!matrix.events?.length) {
                    <li class="step-item"><span class="step-name" style="color: var(--text-muted);">Sin eventos registrados</span></li>
                }
            </ul>
        </div>

        @if (actionMessage) {
            <div style="margin-top: 16px; padding: 12px; border-radius: 8px; font-size: 13px;"
                 [style.background]="actionError ? 'rgba(255,107,107,0.1)' : 'rgba(0,210,211,0.1)'"
                 [style.color]="actionError ? 'var(--danger)' : 'var(--success)'">
                {{ actionMessage }}
            </div>
        }
    }
    `,
    styles: [`
        .modules-section { margin-bottom: 20px; }
        .card-header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 16px;
        }
        .card-header h3 { margin: 0; }
        .modules-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 8px;
        }
        .module-toggle {
            display: flex; justify-content: space-between; align-items: center;
            padding: 12px 16px; border-radius: 10px;
            background: var(--bg-secondary); border: 1px solid var(--border);
            cursor: pointer; transition: all 0.2s;
        }
        .module-toggle:hover { border-color: rgba(108, 92, 231, 0.3); }
        .module-toggle.active { border-color: rgba(0, 210, 211, 0.3); background: rgba(0, 210, 211, 0.05); }
        .module-toggle.core { border-left: 3px solid var(--accent); }
        .module-toggle-info { display: flex; align-items: center; gap: 10px; }
        .module-toggle-icon { font-size: 20px; }
        .module-toggle-name { font-weight: 500; font-size: 14px; }
        .badge-mini {
            display: inline-block; font-size: 9px; font-weight: 600;
            padding: 1px 6px; border-radius: 4px; margin-left: 6px;
            text-transform: uppercase; letter-spacing: 0.5px;
        }
        .badge-mini.core { background: rgba(108, 92, 231, 0.15); color: var(--accent-light); }
        .badge-mini.cat { background: rgba(253, 203, 110, 0.15); color: var(--warning); }

        /* Toggle switch */
        .toggle-switch { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .toggle-slider {
            position: absolute; inset: 0; background: var(--bg-tertiary, #2d2d44);
            border-radius: 24px; transition: 0.3s; cursor: pointer;
        }
        .toggle-slider::before {
            content: ''; position: absolute; width: 18px; height: 18px;
            left: 3px; bottom: 3px; background: white; border-radius: 50%;
            transition: 0.3s;
        }
        .toggle-switch input:checked + .toggle-slider { background: var(--success, #00d2d3); }
        .toggle-switch input:checked + .toggle-slider::before { transform: translateX(20px); }
        .toggle-slider.disabled { opacity: 0.5; cursor: not-allowed; }

        .loading-sm { display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 13px; }
        .spinner-sm {
            width: 16px; height: 16px; border: 2px solid var(--border);
            border-top-color: var(--accent); border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        .save-message {
            margin-top: 12px; padding: 8px 12px; border-radius: 6px;
            font-size: 13px; background: rgba(0,210,211,0.1); color: var(--success);
        }
        .save-message.error { background: rgba(255,107,107,0.1); color: var(--danger); }

        /* Add module dropdown */
        .add-module-dropdown { position: relative; }
        .dropdown-menu {
            position: absolute; top: 100%; right: 0; margin-top: 4px;
            background: var(--bg-card); border: 1px solid var(--border);
            border-radius: 10px; padding: 6px; min-width: 220px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4); z-index: 100;
        }
        .dropdown-item {
            display: flex; align-items: center; gap: 8px;
            width: 100%; padding: 8px 12px; border: none;
            background: transparent; color: var(--text-primary);
            font-size: 13px; font-family: var(--font);
            border-radius: 6px; cursor: pointer; text-align: left;
        }
        .dropdown-item:hover { background: var(--bg-secondary); }

        .empty-modules {
            text-align: center; padding: 20px; color: var(--text-muted);
            font-size: 13px;
        }

        /* Update overlay animation */
        .update-overlay {
            position: fixed; inset: 0; z-index: 1000;
            background: rgba(10, 10, 30, 0.85);
            backdrop-filter: blur(8px);
            display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.3s ease;
        }
        .update-card {
            background: var(--bg-card, #1a1a2e);
            border: 1px solid rgba(108, 92, 231, 0.3);
            border-radius: 20px; padding: 48px 56px;
            text-align: center; max-width: 420px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5),
                        0 0 40px rgba(108, 92, 231, 0.1);
        }
        .update-card h2 { margin: 20px 0 8px; font-size: 22px; }
        .update-card p { color: var(--text-muted); font-size: 14px; margin: 0 0 24px; }
        .update-spinner {
            width: 56px; height: 56px; margin: 0 auto;
            border: 3px solid rgba(108, 92, 231, 0.2);
            border-top-color: #6366f1; border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        .update-progress {
            height: 4px; background: rgba(255,255,255,0.08);
            border-radius: 2px; overflow: hidden; margin-bottom: 12px;
        }
        .update-progress-bar {
            height: 100%; width: 30%;
            background: linear-gradient(90deg, #6366f1, #8b5cf6, #6366f1);
            background-size: 200% 100%;
            border-radius: 2px;
            animation: progressPulse 2s ease-in-out infinite;
        }
        .update-elapsed {
            font-size: 13px; color: var(--text-muted);
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes progressPulse {
            0% { width: 15%; background-position: 200% 0; }
            50% { width: 70%; background-position: 0% 0; }
            100% { width: 15%; background-position: 200% 0; }
        }
        /* Extensions section */
        .extensions-section { margin-bottom: 20px; }
        .ext-card {
            display: flex; align-items: center; gap: 12px;
            padding: 12px 16px; border-radius: 10px;
            background: var(--bg-secondary); border: 1px solid var(--border);
            transition: all 0.2s;
        }
        .ext-card:hover { border-color: rgba(108, 92, 231, 0.3); }
        .ext-card.error { border-color: rgba(231,76,60,0.4); }
        .ext-card.updating { border-color: rgba(108,92,231,0.4); animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
        .ext-meta { display: flex; gap: 8px; align-items: center; margin-left: auto; }
        .ext-version { font-size: 11px; color: var(--text-muted); font-family: monospace; }
        .ext-status { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600; text-transform: uppercase; }
        .ext-status.installed { background: rgba(0,210,211,0.15); color: var(--success); }
        .ext-status.error { background: rgba(231,76,60,0.15); color: var(--danger); }
        .ext-status.updating { background: rgba(108,92,231,0.15); color: var(--accent-light); }
        .ext-actions { display: flex; gap: 4px; }
        .btn-icon {
            width: 30px; height: 30px; border: 1px solid var(--border);
            border-radius: 6px; background: transparent; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            font-size: 14px; transition: all 0.15s;
        }
        .btn-icon:hover { border-color: var(--accent); }
        .btn-icon:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-icon-danger:hover { border-color: var(--danger); }
        .badge-mini[data-type="CHANNEL"] { background: rgba(108,92,231,0.15); color: #a78bfa; }
        .badge-mini[data-type="CONNECTOR"] { background: rgba(0,184,148,0.15); color: #6ee7b7; }
        .badge-mini[data-type="MODULE"] { background: rgba(253,203,110,0.15); color: #fcd34d; }
        .badge-mini[data-type="PLUGIN"] { background: rgba(225,112,85,0.15); color: #fb923c; }
        .badge-mini[data-type="SKILL"] { background: rgba(9,132,227,0.15); color: #60a5fa; }

        /* Extension picker modal */
        .modal-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 200;
            display: flex; align-items: center; justify-content: center;
        }
        .modal {
            background: var(--bg-card, #1a1a2e); border: 1px solid var(--border);
            border-radius: 16px; padding: 24px; width: 90%; max-width: 600px;
            max-height: 80vh; overflow-y: auto;
        }
        .modal h2 { margin: 0 0 16px; font-size: 1.1rem; }
        .ext-search {
            width: 100%; padding: 8px 12px; border-radius: 8px;
            border: 1px solid var(--border); background: var(--bg-secondary);
            color: var(--text-primary); font-size: 14px; margin-bottom: 12px; outline: none;
        }
        .ext-search:focus { border-color: var(--accent); }
        .ext-picker-list { display: flex; flex-direction: column; gap: 8px; }
        .ext-picker-item {
            display: flex; align-items: center; gap: 12px;
            padding: 10px 14px; border-radius: 8px;
            background: var(--bg-secondary); border: 1px solid var(--border);
        }
        .ext-picker-info { flex: 1; }
        .ext-picker-desc { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
    `],
})
export class MatrixDetailComponent implements OnInit, OnDestroy {
    matrix: any = null;
    loading = true;
    actionMessage = '';
    actionError = false;

    // Update animation
    updating = false;
    updateElapsed = 0;
    private updateInterval: any = null;
    private updatePollInterval: any = null;

    // Modules
    allModules: any[] = [];
    activeModuleSlugs: string[] = [];
    modulesLoading = true;
    modulesDirty = false;
    savingModules = false;
    moduleSaveMessage = '';
    moduleSaveError = false;
    showAddMenu = false;

    // Extensions
    matrixPackages: any[] = [];
    extensionsLoading = true;
    allCatalogPackages: any[] = [];
    showExtPicker = false;
    extSearch = '';
    installingId: string | null = null;
    extMessage = '';
    extError = false;

    /** Only show Core modules + modules assigned to this matrix */
    get visibleModules(): any[] {
        return this.allModules.filter(m =>
            m.isCore || this.activeModuleSlugs.includes(m.slug),
        );
    }

    /** Optional modules not yet assigned to this matrix */
    get availableToAdd(): any[] {
        return this.allModules.filter(m =>
            !m.isCore && !this.activeModuleSlugs.includes(m.slug),
        );
    }

    get statusIconClass() {
        const s = this.matrix?.status?.toLowerCase();
        if (s === 'active') return 'green';
        if (s === 'error') return 'orange';
        return 'purple';
    }

    constructor(
        private api: ApiService,
        private route: ActivatedRoute,
        private router: Router,
    ) { }

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id')!;
        this.api.getMatrix(id).subscribe({
            next: (m: any) => {
                this.matrix = m;
                this.loading = false;
                this.loadModules();
                this.loadExtensions();
                // If already UPDATING when page loads, start polling
                if (m.status === 'UPDATING') {
                    this.startUpdatePolling();
                }
            },
            error: () => { this.loading = false; },
        });
    }

    ngOnDestroy() {
        this.stopUpdatePolling();
    }

    loadModules() {
        this.modulesLoading = true;
        this.api.getModules().subscribe({
            next: (all: any[]) => {
                this.allModules = all;
                this.api.getMatrixModules(this.matrix.id).subscribe({
                    next: (active: any[]) => {
                        this.activeModuleSlugs = active.map((a: any) => a.module.slug);
                        this.modulesLoading = false;
                    },
                    error: () => { this.modulesLoading = false; },
                });
            },
            error: () => { this.modulesLoading = false; },
        });
    }

    isModuleActive(slug: string): boolean {
        return this.activeModuleSlugs.includes(slug);
    }

    toggleModule(slug: string, event: Event) {
        const checked = (event.target as HTMLInputElement).checked;
        if (checked && !this.activeModuleSlugs.includes(slug)) {
            this.activeModuleSlugs.push(slug);
        } else if (!checked) {
            this.activeModuleSlugs = this.activeModuleSlugs.filter(s => s !== slug);
        }
        this.modulesDirty = true;
        this.moduleSaveMessage = '';
    }

    addModule(mod: any) {
        if (!this.activeModuleSlugs.includes(mod.slug)) {
            this.activeModuleSlugs.push(mod.slug);
            this.modulesDirty = true;
            this.moduleSaveMessage = '';
        }
        this.showAddMenu = false;
    }

    saveModules() {
        this.savingModules = true;
        this.moduleSaveMessage = '';
        this.api.setMatrixModules(this.matrix.id, this.activeModuleSlugs).subscribe({
            next: () => {
                this.savingModules = false;
                this.modulesDirty = false;
                this.moduleSaveMessage = '✅ Módulos actualizados';
                this.moduleSaveError = false;
                this.loadModules();
            },
            error: (err: any) => {
                this.savingModules = false;
                this.moduleSaveMessage = err.error?.message || 'Error al guardar';
                this.moduleSaveError = true;
            },
        });
    }

    // ── Extensions ──────────────────────────────────

    loadExtensions() {
        this.extensionsLoading = true;
        this.api.getMatrixPackages(this.matrix.id).subscribe({
            next: (pkgs: any[]) => { this.matrixPackages = pkgs; this.extensionsLoading = false; },
            error: () => { this.extensionsLoading = false; },
        });
        this.api.getAvailablePackages(this.matrix.id).subscribe({
            next: (all: any[]) => { this.allCatalogPackages = all; },
        });
    }

    get availableExtensions(): any[] {
        const installedIds = new Set(this.matrixPackages.map((mp: any) => mp.packageId));
        let list = this.allCatalogPackages.filter(p => !installedIds.has(p.id));
        if (this.extSearch) {
            const q = this.extSearch.toLowerCase();
            list = list.filter(p => p.displayName.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
        }
        return list;
    }

    getExtIcon(type: string): string {
        switch (type) {
            case 'CHANNEL': return '📱';
            case 'CONNECTOR': return '🔗';
            case 'MODULE': return '🧩';
            case 'PLUGIN': return '🔌';
            case 'SKILL': return '🎯';
            default: return '📦';
        }
    }

    installExt(pkg: any) {
        this.installingId = pkg.id;
        this.extMessage = '';
        this.api.installPackageToMatrix(this.matrix.id, pkg.id).subscribe({
            next: (res: any) => {
                this.installingId = null;
                this.extMessage = res.success ? `✅ ${pkg.displayName} instalado` : `⚠️ ${res.message}`;
                this.extError = !res.success;
                this.loadExtensions();
            },
            error: (err: any) => {
                this.installingId = null;
                this.extMessage = err.error?.message || 'Error al instalar';
                this.extError = true;
            },
        });
    }

    uninstallExt(mp: any) {
        if (!confirm(`¿Desinstalar ${mp.package?.displayName} de esta matriz?`)) return;
        this.api.uninstallPackageFromMatrix(this.matrix.id, mp.packageId).subscribe({
            next: () => {
                this.extMessage = `✅ ${mp.package?.displayName} desinstalado`;
                this.extError = false;
                this.loadExtensions();
            },
            error: (err: any) => {
                this.extMessage = err.error?.message || 'Error al desinstalar';
                this.extError = true;
            },
        });
    }

    updateExt(mp: any) {
        mp.status = 'updating';
        this.extMessage = '';
        this.api.updatePackageOnMatrix(this.matrix.id, mp.packageId).subscribe({
            next: (res: any) => {
                this.extMessage = res.success ? `✅ ${mp.package?.displayName} actualizado` : `⚠️ ${res.message}`;
                this.extError = !res.success;
                this.loadExtensions();
            },
            error: (err: any) => {
                this.extMessage = err.error?.message || 'Error al actualizar';
                this.extError = true;
                this.loadExtensions();
            },
        });
    }

    action(type: string) {
        const id = this.matrix.id;
        this.actionMessage = '';

        if (type === 'delete' && !confirm('¿Eliminar esta matriz? Se borrarán contenedores y volúmenes.')) return;
        if (type === 'suspend' && !confirm('¿Suspender esta matriz?')) return;

        if (type === 'update') {
            // Async update with animation
            this.api.updateMatrix(id).subscribe({
                next: () => {
                    this.matrix.status = 'UPDATING';
                    this.startUpdatePolling();
                },
                error: (err: any) => {
                    this.actionMessage = err.error?.message || 'Error al iniciar actualización';
                    this.actionError = true;
                },
            });
            return;
        }

        const obs = type === 'suspend' ? this.api.suspendMatrix(id)
            : type === 'reactivate' ? this.api.reactivateMatrix(id)
                : this.api.deleteMatrix(id);

        obs.subscribe({
            next: () => {
                if (type === 'delete') {
                    this.router.navigate(['/dashboard']);
                } else {
                    this.actionMessage = `Acción "${type}" completada`;
                    this.actionError = false;
                    this.ngOnInit();
                }
            },
            error: (err: any) => {
                this.actionMessage = err.error?.message || 'Error en la acción';
                this.actionError = true;
            },
        });
    }

    private startUpdatePolling() {
        this.updating = true;
        this.updateElapsed = 0;

        // Elapsed timer
        this.updateInterval = setInterval(() => {
            this.updateElapsed++;
        }, 1000);

        // Poll matrix status every 5s
        this.updatePollInterval = setInterval(() => {
            this.api.getMatrix(this.matrix.id).subscribe({
                next: (m: any) => {
                    if (m.status === 'ACTIVE' || m.status === 'ERROR') {
                        this.matrix = m;
                        this.stopUpdatePolling();
                        if (m.status === 'ACTIVE') {
                            this.actionMessage = `✅ Actualización completada — commit ${m.gitCommit}`;
                            this.actionError = false;
                        } else {
                            this.actionMessage = `❌ Error en actualización: ${m.provisionLog || 'Ver logs'}`;
                            this.actionError = true;
                        }
                        this.loadModules();
                    }
                },
            });
        }, 5000);
    }

    private stopUpdatePolling() {
        this.updating = false;
        if (this.updateInterval) { clearInterval(this.updateInterval); this.updateInterval = null; }
        if (this.updatePollInterval) { clearInterval(this.updatePollInterval); this.updatePollInterval = null; }
    }
}
