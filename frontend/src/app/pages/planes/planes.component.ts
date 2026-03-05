import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

const PLAN_OPTIONS = [
    { value: 'FREE', label: 'Free' },
    { value: 'PERSONAL', label: 'Personal' },
    { value: 'STARTER', label: 'Starter' },
    { value: 'PRO', label: 'Pro' },
    { value: 'ENTERPRISE', label: 'Enterprise' },
];

@Component({
    selector: 'app-planes',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="page-header">
        <div>
            <h1>Planes y Precios</h1>
            <p>Define los tiers y precios de tu plataforma</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">➕ Nuevo Plan</button>
    </div>

    <!-- Plans grid -->
    <div class="plans-grid">
        @for (tier of tiers; track tier.id) {
        <div class="plan-card" [class.inactive]="!tier.isActive">
            <div class="plan-header">
                <h3>{{ tier.displayName }}</h3>
                <span class="plan-badge">{{ tier.name }}</span>
            </div>
            <div class="plan-price">
                @if (Number(tier.price) === 0) {
                    <span class="price-value">Gratis</span>
                } @else {
                    <span class="price-value">{{ tier.price }}€</span>
                    <span class="price-period">/{{ tier.billingPeriod === 'yearly' ? 'año' : 'mes' }}</span>
                }
            </div>
            <div class="plan-limits">
                <div class="limit-item">👤 {{ tier.maxUsers }} {{ tier.maxUsers === 1 ? 'usuario' : 'usuarios' }}</div>
                <div class="limit-item">📦 {{ tier.maxExtensions === 0 ? '∞' : tier.maxExtensions }} extensiones</div>
            </div>
            @if (tier.description) {
            <p class="plan-desc">{{ tier.description }}</p>
            }
            @if (!tier.isActive) {
            <span class="inactive-tag">⏸ Inactivo</span>
            }
            <div class="plan-actions">
                <button class="btn btn-sm btn-secondary" (click)="openEdit(tier)">✏️ Editar</button>
                <button class="btn btn-sm btn-danger" (click)="deleteTier(tier)">🗑️</button>
            </div>
        </div>
        } @empty {
        <div class="empty-state">
            <p>No hay planes definidos todavía</p>
            <button class="btn btn-primary" (click)="openCreate()">Crear primer plan</button>
        </div>
        }
    </div>

    <!-- Modal -->
    @if (showModal) {
    <div class="modal-overlay" (click)="showModal = false">
        <div class="modal" (click)="$event.stopPropagation()">
            <h2>{{ editing ? 'Editar Plan' : 'Nuevo Plan' }}</h2>
            <div class="form-grid">
                <div class="form-group">
                    <label>Tier</label>
                    <select [(ngModel)]="form.name" [disabled]="!!editing">
                        @for (opt of planOptions; track opt.value) {
                        <option [value]="opt.value">{{ opt.label }}</option>
                        }
                    </select>
                </div>
                <div class="form-group">
                    <label>Nombre visible</label>
                    <input [(ngModel)]="form.displayName" placeholder="Plan Pro">
                </div>
                <div class="form-group">
                    <label>Precio (€)</label>
                    <input type="number" [(ngModel)]="form.price" min="0" step="0.01" placeholder="0.00">
                </div>
                <div class="form-group">
                    <label>Periodo</label>
                    <select [(ngModel)]="form.billingPeriod">
                        <option value="monthly">Mensual</option>
                        <option value="yearly">Anual</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Máx. usuarios</label>
                    <input type="number" [(ngModel)]="form.maxUsers" min="1">
                </div>
                <div class="form-group">
                    <label>Máx. extensiones (0 = ilimitado)</label>
                    <input type="number" [(ngModel)]="form.maxExtensions" min="0">
                </div>
                <div class="form-group full-width">
                    <label>Descripción</label>
                    <textarea [(ngModel)]="form.description" rows="2" placeholder="Qué incluye este plan..."></textarea>
                </div>
                <div class="form-group">
                    <label>Stripe Price ID</label>
                    <input [(ngModel)]="form.stripePriceId" placeholder="price_xxxxx">
                </div>
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" [(ngModel)]="form.isActive">
                        Plan activo (visible para clientes)
                    </label>
                </div>
            </div>
            @if (error) {
            <div class="error-msg">{{ error }}</div>
            }
            <div class="modal-actions">
                <button class="btn btn-secondary" (click)="showModal = false">Cancelar</button>
                <button class="btn btn-primary" (click)="save()" [disabled]="saving">
                    {{ saving ? 'Guardando...' : (editing ? 'Guardar' : 'Crear') }}
                </button>
            </div>
        </div>
    </div>
    }
    `,
    styles: [`
        .plans-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; padding: 20px 0;
        }
        .plan-card {
            background: var(--bg-card, rgba(255,255,255,0.03)); border: 1px solid rgba(255,255,255,0.06);
            border-radius: 16px; padding: 24px; position: relative; transition: all 0.2s;
        }
        .plan-card:hover { border-color: rgba(108,92,231,0.3); transform: translateY(-2px); }
        .plan-card.inactive { opacity: 0.5; }
        .plan-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .plan-header h3 { margin: 0; font-size: 1.2rem; color: #e8e8f0; }
        .plan-badge {
            background: rgba(108,92,231,0.15); color: #a29bfe; padding: 3px 10px;
            border-radius: 20px; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.5px;
        }
        .plan-price { margin-bottom: 16px; }
        .price-value { font-size: 2rem; font-weight: 700; color: #6c5ce7; }
        .price-period { font-size: 0.9rem; color: #6b6b8a; }
        .plan-limits { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
        .limit-item { font-size: 0.85rem; color: #a0a0b8; }
        .plan-desc { font-size: 0.8rem; color: #6b6b8a; margin: 8px 0; }
        .inactive-tag {
            display: inline-block; background: rgba(255,107,107,0.1); color: #ff6b6b;
            padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; margin-bottom: 8px;
        }
        .plan-actions { display: flex; gap: 8px; margin-top: 12px; }
        .empty-state { grid-column: 1 / -1; text-align: center; padding: 60px; color: #6b6b8a; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .form-group.full-width { grid-column: 1 / -1; }
    `],
})
export class PlanesComponent implements OnInit {
    tiers: any[] = [];
    showModal = false;
    editing: any = null;
    saving = false;
    error = '';
    planOptions = PLAN_OPTIONS;
    Number = Number;

    form: any = {
        name: 'FREE', displayName: '', price: 0, billingPeriod: 'monthly',
        description: '', maxUsers: 1, maxExtensions: 0, stripePriceId: '', isActive: true,
    };

    constructor(private api: ApiService) { }

    ngOnInit() { this.load(); }

    load() {
        this.api.getPricingTiers().subscribe((d: any[]) => this.tiers = d);
    }

    openCreate() {
        this.editing = null;
        this.form = { name: 'FREE', displayName: '', price: 0, billingPeriod: 'monthly', description: '', maxUsers: 1, maxExtensions: 0, stripePriceId: '', isActive: true };
        this.error = '';
        this.showModal = true;
    }

    openEdit(tier: any) {
        this.editing = tier;
        this.form = {
            name: tier.name, displayName: tier.displayName, price: Number(tier.price),
            billingPeriod: tier.billingPeriod || 'monthly', description: tier.description || '',
            maxUsers: tier.maxUsers, maxExtensions: tier.maxExtensions,
            stripePriceId: tier.stripePriceId || '', isActive: tier.isActive,
        };
        this.error = '';
        this.showModal = true;
    }

    save() {
        this.saving = true;
        this.error = '';
        const obs = this.editing
            ? this.api.updatePricingTier(this.editing.id, this.form)
            : this.api.createPricingTier(this.form);
        obs.subscribe({
            next: () => { this.saving = false; this.showModal = false; this.load(); },
            error: (err: any) => { this.saving = false; this.error = err.error?.message || 'Error al guardar'; },
        });
    }

    deleteTier(tier: any) {
        if (confirm(`¿Eliminar el plan "${tier.displayName}"?`)) {
            this.api.deletePricingTier(tier.id).subscribe(() => this.load());
        }
    }
}
