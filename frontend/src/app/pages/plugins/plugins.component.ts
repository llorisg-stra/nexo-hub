import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

const ECHO_AGENT_TEMPLATE = `import { Logger } from '@nestjs/common';
import {
    AgentPlugin, AgentMetadata, AgentConfig, AgentStatus,
    HandleMessageParams, HandleMessageResult,
} from '../../plugin.interface';
import type { ChannelType } from '../../../channels/channel.interface';

export class MyPlugin implements AgentPlugin {
    private readonly logger = new Logger('MyPlugin');
    private status: AgentStatus = 'inactive';

    metadata: AgentMetadata = {
        id: 'my-plugin',
        name: 'My Plugin',
        version: '1.0.0',
        description: 'Describe what your plugin does',
        author: 'Strategia Laboratory',
        tags: ['custom'],
    };

    async onActivate(config: AgentConfig): Promise<void> {
        this.status = 'active';
        this.logger.log('Plugin activated');
    }

    async onDeactivate(): Promise<void> {
        this.status = 'inactive';
    }

    getStatus(): AgentStatus { return this.status; }

    getSupportedChannels(): ChannelType[] {
        return ['webchat', 'whatsapp', 'email'];
    }

    async handleMessage(params: HandleMessageParams): Promise<HandleMessageResult> {
        const { message } = params;
        return {
            response: \`Received: "\${message.content}"\`,
            metadata: { plugin: this.metadata.id },
        };
    }

    getSecretKeys(): string[] { return []; }
    getBrainScopes() { return []; }
    getEvents() { return []; }
}
`;

const AVAILABLE_CHANNELS = [
    'webchat', 'whatsapp', 'email', 'telegram',
    'sms', 'slack', 'teams', 'discord', 'voice',
];

@Component({
    selector: 'app-plugins',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="page-header">
        <div>
            <h1>🔌 Plugin Marketplace</h1>
            <p>Crea y distribuye plugins a las matrices</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">+ Nuevo Plugin</button>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon purple">🔌</div>
            <div>
                <div class="stat-value">{{ plugins.length }}</div>
                <div class="stat-label">Total</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon green">✅</div>
            <div>
                <div class="stat-value">{{ publishedCount }}</div>
                <div class="stat-label">Publicados</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon orange">📝</div>
            <div>
                <div class="stat-value">{{ draftCount }}</div>
                <div class="stat-label">Borradores</div>
            </div>
        </div>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs">
        <button class="filter-tab" [class.active]="filter === ''" (click)="setFilter('')">Todos</button>
        <button class="filter-tab" [class.active]="filter === 'PUBLISHED'" (click)="setFilter('PUBLISHED')">Publicados</button>
        <button class="filter-tab" [class.active]="filter === 'DRAFT'" (click)="setFilter('DRAFT')">Borradores</button>
        <button class="filter-tab" [class.active]="filter === 'ARCHIVED'" (click)="setFilter('ARCHIVED')">Archivados</button>
    </div>

    <!-- Plugin Cards -->
    @if (loading) {
        <div class="loading"><div class="spinner"></div>Cargando plugins...</div>
    } @else if (filteredPlugins.length === 0) {
        <div class="empty">No hay plugins {{ filter ? 'con este filtro' : 'creados aún' }}</div>
    } @else {
        <div class="plugins-grid">
            @for (plugin of filteredPlugins; track plugin.id) {
                <div class="plugin-card" [class.published]="plugin.status === 'PUBLISHED'" [class.archived]="plugin.status === 'ARCHIVED'">
                    <div class="plugin-card-header">
                        <div class="plugin-icon">{{ plugin.icon || '🔌' }}</div>
                        <div class="plugin-info">
                            <h3>{{ plugin.name }}</h3>
                            <span class="plugin-version">v{{ plugin.version }}</span>
                        </div>
                        <span class="badge" [class]="plugin.status.toLowerCase()">{{ plugin.status }}</span>
                    </div>
                    <p class="plugin-desc">{{ plugin.description }}</p>
                    <div class="plugin-meta">
                        <span class="plugin-author">👤 {{ plugin.author }}</span>
                        <span class="plugin-channels">📡 {{ plugin.supportedChannels?.length || 0 }} canales</span>
                    </div>
                    @if (plugin.tags?.length) {
                        <div class="plugin-tags">
                            @for (tag of plugin.tags; track tag) {
                                <span class="tag">{{ tag }}</span>
                            }
                        </div>
                    }
                    <div class="plugin-actions">
                        <button class="btn btn-sm btn-secondary" (click)="openEditModal(plugin)">✏️ Editar</button>
                        @if (plugin.status === 'DRAFT') {
                            <button class="btn btn-sm btn-publish" (click)="publish(plugin)">🚀 Publicar</button>
                        } @else if (plugin.status === 'PUBLISHED') {
                            <button class="btn btn-sm btn-secondary" (click)="unpublish(plugin)">⏸️ Despublicar</button>
                        }
                        <button class="btn btn-sm btn-danger" (click)="confirmDelete(plugin)">🗑️</button>
                    </div>
                </div>
            }
        </div>
    }

    <!-- Create/Edit Modal -->
    @if (showModal) {
        <div class="modal-overlay" (click)="closeModal()">
            <div class="modal modal-lg" (click)="$event.stopPropagation()">
                <h2>{{ editingPlugin ? '✏️ Editar Plugin' : '🔌 Nuevo Plugin' }}</h2>
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group flex-1">
                            <label>Nombre *</label>
                            <input class="form-control" [(ngModel)]="form.name" placeholder="mi-plugin">
                        </div>
                        <div class="form-group" style="width: 120px">
                            <label>Versión</label>
                            <input class="form-control" [(ngModel)]="form.version" placeholder="1.0.0">
                        </div>
                        <div class="form-group" style="width: 80px">
                            <label>Icono</label>
                            <input class="form-control" [(ngModel)]="form.icon" placeholder="🤖">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Descripción *</label>
                        <input class="form-control" [(ngModel)]="form.description" placeholder="¿Qué hace este plugin?">
                    </div>
                    <div class="form-group">
                        <label>Autor</label>
                        <input class="form-control" [(ngModel)]="form.author" placeholder="Strategia Laboratory">
                    </div>
                    <div class="form-group">
                        <label>Tags (separados por coma)</label>
                        <input class="form-control" [(ngModel)]="tagsInput" placeholder="chatbot, atención, ventas">
                    </div>
                    <div class="form-group">
                        <label>Canales Soportados</label>
                        <div class="channel-selector">
                            @for (ch of availableChannels; track ch) {
                                <label class="channel-chip" [class.selected]="form.supportedChannels.includes(ch)">
                                    <input type="checkbox" [checked]="form.supportedChannels.includes(ch)" (change)="toggleChannel(ch)">
                                    {{ ch }}
                                </label>
                            }
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Código del Plugin (TypeScript)</label>
                        <textarea class="form-control code-editor" [(ngModel)]="form.code" rows="18" spellcheck="false"></textarea>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
                    <button class="btn btn-primary" (click)="savePlugin()" [disabled]="!form.name || !form.description || !form.code">
                        {{ editingPlugin ? 'Guardar Cambios' : 'Crear Plugin' }}
                    </button>
                </div>
            </div>
        </div>
    }

    <!-- Delete Confirm Modal -->
    @if (showDeleteModal) {
        <div class="modal-overlay" (click)="showDeleteModal = false">
            <div class="modal" (click)="$event.stopPropagation()">
                <h2>⚠️ Eliminar Plugin</h2>
                <p>¿Estás seguro de que quieres eliminar <strong>{{ deletingPlugin?.name }}</strong>?</p>
                <p style="color: var(--text-muted); margin-top: 8px; font-size: 13px;">
                    Esta acción no se puede deshacer. Los plugins ya distribuidos no se verán afectados.
                </p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" (click)="showDeleteModal = false">Cancelar</button>
                    <button class="btn btn-danger" (click)="deletePlugin()">Eliminar</button>
                </div>
            </div>
        </div>
    }
    `,
    styles: [`
        .filter-tabs {
            display: flex;
            gap: 4px;
            margin-bottom: 20px;
            background: var(--bg-secondary);
            border-radius: 10px;
            padding: 4px;
            border: 1px solid var(--border);
        }
        .filter-tab {
            padding: 8px 16px;
            border: none;
            background: transparent;
            color: var(--text-secondary);
            font-size: 13px;
            font-weight: 500;
            font-family: var(--font);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .filter-tab:hover { color: var(--text-primary); }
        .filter-tab.active {
            background: var(--accent);
            color: white;
        }

        .plugins-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
            gap: 16px;
        }
        .plugin-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 20px;
            transition: all 0.2s;
        }
        .plugin-card:hover {
            border-color: rgba(108, 92, 231, 0.3);
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .plugin-card.published { border-left: 3px solid var(--success); }
        .plugin-card.archived { opacity: 0.6; }

        .plugin-card-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
        }
        .plugin-icon {
            width: 44px;
            height: 44px;
            border-radius: 10px;
            background: linear-gradient(135deg, var(--accent), var(--accent-light));
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
        }
        .plugin-info { flex: 1; }
        .plugin-info h3 { font-size: 16px; font-weight: 600; }
        .plugin-version {
            font-size: 12px;
            color: var(--text-muted);
        }

        .badge.draft {
            background: rgba(253, 203, 110, 0.15);
            color: var(--warning);
        }
        .badge.published {
            background: rgba(0, 210, 211, 0.15);
            color: var(--success);
        }
        .badge.archived {
            background: rgba(104, 104, 160, 0.1);
            color: var(--text-muted);
        }

        .plugin-desc {
            font-size: 13px;
            color: var(--text-secondary);
            margin-bottom: 12px;
            line-height: 1.5;
        }
        .plugin-meta {
            display: flex;
            gap: 16px;
            font-size: 12px;
            color: var(--text-muted);
            margin-bottom: 10px;
        }
        .plugin-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 14px;
        }
        .tag {
            padding: 2px 8px;
            background: rgba(108, 92, 231, 0.12);
            color: var(--accent-light);
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
        }
        .plugin-actions {
            display: flex;
            gap: 8px;
            padding-top: 12px;
            border-top: 1px solid var(--border);
        }
        .btn-publish {
            background: rgba(0, 210, 211, 0.15);
            color: var(--success);
            border: 1px solid rgba(0, 210, 211, 0.2);
        }
        .btn-publish:hover { background: rgba(0, 210, 211, 0.25); }

        /* Modal overrides */
        .modal-lg { max-width: 780px; }
        .modal-body { max-height: 65vh; overflow-y: auto; }
        .form-row { display: flex; gap: 12px; }
        .flex-1 { flex: 1; }

        .channel-selector {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .channel-chip {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 6px;
            font-size: 13px;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.2s;
        }
        .channel-chip input { display: none; }
        .channel-chip.selected {
            background: rgba(108, 92, 231, 0.15);
            border-color: var(--accent);
            color: var(--accent-light);
        }

        .code-editor {
            font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
            font-size: 13px;
            line-height: 1.6;
            tab-size: 4;
            resize: vertical;
            min-height: 300px;
        }
    `],
})
export class PluginsComponent implements OnInit {
    plugins: any[] = [];
    filteredPlugins: any[] = [];
    filter = '';
    loading = true;

    showModal = false;
    showDeleteModal = false;
    editingPlugin: any = null;
    deletingPlugin: any = null;
    tagsInput = '';
    availableChannels = AVAILABLE_CHANNELS;

    form = {
        name: '',
        description: '',
        code: '',
        version: '1.0.0',
        author: 'Strategia Laboratory',
        icon: '🤖',
        tags: [] as string[],
        supportedChannels: [] as string[],
    };

    get publishedCount() { return this.plugins.filter(p => p.status === 'PUBLISHED').length; }
    get draftCount() { return this.plugins.filter(p => p.status === 'DRAFT').length; }

    constructor(private api: ApiService) { }

    ngOnInit() { this.loadPlugins(); }

    loadPlugins() {
        this.loading = true;
        this.api.getPlugins().subscribe({
            next: (data) => {
                this.plugins = data;
                this.applyFilter();
                this.loading = false;
            },
            error: () => { this.loading = false; },
        });
    }

    setFilter(status: string) {
        this.filter = status;
        this.applyFilter();
    }

    applyFilter() {
        this.filteredPlugins = this.filter
            ? this.plugins.filter(p => p.status === this.filter)
            : this.plugins;
    }

    openCreateModal() {
        this.editingPlugin = null;
        this.form = {
            name: '', description: '', code: ECHO_AGENT_TEMPLATE,
            version: '1.0.0', author: 'Strategia Laboratory',
            icon: '🤖', tags: [], supportedChannels: ['webchat'],
        };
        this.tagsInput = '';
        this.showModal = true;
    }

    openEditModal(plugin: any) {
        this.editingPlugin = plugin;
        this.form = {
            name: plugin.name,
            description: plugin.description,
            code: plugin.code,
            version: plugin.version,
            author: plugin.author || '',
            icon: plugin.icon || '🤖',
            tags: [...(plugin.tags || [])],
            supportedChannels: [...(plugin.supportedChannels || [])],
        };
        this.tagsInput = this.form.tags.join(', ');
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
        this.editingPlugin = null;
    }

    toggleChannel(ch: string) {
        const idx = this.form.supportedChannels.indexOf(ch);
        if (idx >= 0) { this.form.supportedChannels.splice(idx, 1); }
        else { this.form.supportedChannels.push(ch); }
    }

    savePlugin() {
        const data = {
            ...this.form,
            tags: this.tagsInput.split(',').map(t => t.trim()).filter(Boolean),
        };

        if (this.editingPlugin) {
            this.api.updatePlugin(this.editingPlugin.id, data).subscribe({
                next: () => { this.closeModal(); this.loadPlugins(); },
            });
        } else {
            this.api.createPlugin(data).subscribe({
                next: () => { this.closeModal(); this.loadPlugins(); },
            });
        }
    }

    publish(plugin: any) {
        this.api.publishPlugin(plugin.id).subscribe(() => this.loadPlugins());
    }

    unpublish(plugin: any) {
        this.api.unpublishPlugin(plugin.id).subscribe(() => this.loadPlugins());
    }

    confirmDelete(plugin: any) {
        this.deletingPlugin = plugin;
        this.showDeleteModal = true;
    }

    deletePlugin() {
        if (!this.deletingPlugin) return;
        this.api.deletePlugin(this.deletingPlugin.id).subscribe({
            next: () => {
                this.showDeleteModal = false;
                this.deletingPlugin = null;
                this.loadPlugins();
            },
        });
    }
}
