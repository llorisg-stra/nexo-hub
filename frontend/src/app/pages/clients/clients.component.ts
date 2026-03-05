import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-clients',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="page-header">
        <div>
            <h1>Clientes</h1>
            <p>Gestión de clientes y sus instancias</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">➕ Nuevo Cliente</button>
    </div>

    <!-- Create / Edit Modal -->
    @if (showForm) {
        <div class="modal-overlay" (click)="showForm = false">
            <div class="modal" (click)="$event.stopPropagation()">
                <h2>{{ editingId ? 'Editar Cliente' : 'Nuevo Cliente' }}</h2>
                <div class="form-group">
                    <label>Nombre *</label>
                    <input class="form-control" [(ngModel)]="form.name" placeholder="Acme Corp">
                </div>
                <div class="form-group">
                    <label>Email *</label>
                    <input class="form-control" [(ngModel)]="form.email" type="email" placeholder="admin&#64;acme.com">
                </div>
                <div class="form-group">
                    <label>Empresa</label>
                    <input class="form-control" [(ngModel)]="form.company" placeholder="Acme S.L.">
                </div>
                <div class="form-group">
                    <label>Teléfono</label>
                    <input class="form-control" [(ngModel)]="form.phone" placeholder="+34 600 000 000">
                </div>
                <div class="form-group">
                    <label>Plan</label>
                    <select class="form-control" [(ngModel)]="form.plan">
                        <option value="FREE">Free</option>
                        <option value="PERSONAL">Personal</option>
                        <option value="STARTER">Starter</option>
                        <option value="PRO">Pro</option>
                        <option value="ENTERPRISE">Enterprise</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Notas</label>
                    <textarea class="form-control" [(ngModel)]="form.notes" rows="3"></textarea>
                </div>
                @if (formError) {
                    <div style="background: rgba(255,107,107,0.1); border: 1px solid rgba(255,107,107,0.3);
                                border-radius: 8px; padding: 10px; margin-bottom: 12px; color: var(--danger); font-size: 13px;">
                        {{ formError }}
                    </div>
                }
                <div class="modal-actions">
                    <button class="btn btn-secondary" (click)="showForm = false">Cancelar</button>
                    <button class="btn btn-primary" (click)="saveClient()" [disabled]="!form.name || !form.email">
                        {{ editingId ? 'Guardar Cambios' : 'Crear Cliente' }}
                    </button>
                </div>
            </div>
        </div>
    }

    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Empresa</th>
                    <th>Plan</th>
                    <th>Matrices</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                @for (c of clients; track c.id) {
                    <tr>
                        <td style="font-weight: 600;">{{ c.name }}</td>
                        <td>{{ c.email }}</td>
                        <td>{{ c.company || '—' }}</td>
                        <td><span class="badge active">{{ c.plan || 'STARTER' }}</span></td>
                        <td>
                            @for (m of c.matrices || []; track m.id) {
                                <a [routerLink]="['/matrices', m.id]" class="badge" [class]="m.status.toLowerCase()" style="margin-right: 4px;">
                                    {{ m.slug }}
                                </a>
                            }
                            @if (!c.matrices?.length) { <span style="color: var(--text-muted);">—</span> }
                        </td>
                        <td><span class="badge" [class]="c.status === 'CANCELLED' ? 'deleted' : 'active'">{{ c.status || 'ACTIVE' }}</span></td>
                        <td style="display: flex; gap: 4px;">
                            <button class="btn btn-sm btn-secondary" (click)="openEdit(c)" title="Editar">✏️</button>
                            <button class="btn btn-sm btn-danger" (click)="deleteClient(c.id)" title="Eliminar">🗑️</button>
                        </td>
                    </tr>
                } @empty {
                    <tr><td colspan="7" class="empty">No hay clientes registrados</td></tr>
                }
            </tbody>
        </table>
    </div>
    `,
})
export class ClientsComponent implements OnInit {
    clients: any[] = [];
    showForm = false;
    editingId: string | null = null;
    formError = '';
    form = { name: '', email: '', company: '', phone: '', plan: 'STARTER', notes: '' };

    constructor(private api: ApiService) { }

    ngOnInit() { this.load(); }

    load() {
        this.api.getClients().subscribe((d: any[]) => this.clients = d);
    }

    openCreate() {
        this.editingId = null;
        this.form = { name: '', email: '', company: '', phone: '', plan: 'STARTER', notes: '' };
        this.formError = '';
        this.showForm = true;
    }

    openEdit(client: any) {
        this.editingId = client.id;
        this.form = {
            name: client.name || '',
            email: client.email || '',
            company: client.company || '',
            phone: client.phone || '',
            plan: client.plan || 'STARTER',
            notes: client.notes || '',
        };
        this.formError = '';
        this.showForm = true;
    }

    saveClient() {
        this.formError = '';
        if (this.editingId) {
            // Update existing
            this.api.updateClient(this.editingId, this.form).subscribe({
                next: () => { this.showForm = false; this.load(); },
                error: (err: any) => {
                    this.formError = err.error?.message || err.message || 'Error al actualizar el cliente';
                },
            });
        } else {
            // Create new
            this.api.createClient(this.form).subscribe({
                next: () => { this.showForm = false; this.load(); },
                error: (err: any) => {
                    this.formError = err.error?.message || err.message || 'Error al crear el cliente';
                },
            });
        }
    }

    deleteClient(id: string) {
        if (confirm('¿Eliminar este cliente?')) {
            this.api.deleteClient(id).subscribe(() => this.load());
        }
    }
}
