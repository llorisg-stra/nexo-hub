import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
    { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard] },
    { path: 'clients', loadComponent: () => import('./pages/clients/clients.component').then(m => m.ClientsComponent), canActivate: [authGuard] },
    { path: 'vps', loadComponent: () => import('./pages/vps/vps.component').then(m => m.VpsComponent), canActivate: [authGuard] },
    { path: 'provision', loadComponent: () => import('./pages/provision/provision.component').then(m => m.ProvisionComponent), canActivate: [authGuard] },
    { path: 'matrices', loadComponent: () => import('./pages/matrices/matrices.component').then(m => m.MatricesComponent), canActivate: [authGuard] },
    { path: 'matrices/:id', loadComponent: () => import('./pages/matrix-detail/matrix-detail.component').then(m => m.MatrixDetailComponent), canActivate: [authGuard] },
    { path: 'extensiones', loadComponent: () => import('./pages/extensiones/extensiones.component').then(m => m.ExtensionesComponent), canActivate: [authGuard] },
    { path: 'planes', loadComponent: () => import('./pages/planes/planes.component').then(m => m.PlanesComponent), canActivate: [authGuard] },
    // Legacy routes redirect to extensiones
    { path: 'plugins', redirectTo: 'extensiones' },
    { path: 'modules', redirectTo: 'extensiones' },
    { path: 'audit', loadComponent: () => import('./pages/audit/audit.component').then(m => m.AuditComponent), canActivate: [authGuard] },
    { path: 'workers', loadComponent: () => import('./pages/workers/workers.component').then(m => m.WorkersComponent), canActivate: [authGuard] },
    { path: '**', redirectTo: 'dashboard' },
];
