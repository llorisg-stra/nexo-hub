import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private base = '/api'; // proxied to panel-backend:3100

    constructor(private http: HttpClient) { }

    // ---- Clients ----
    getClients(): Observable<any[]> {
        return this.http.get<any[]>(`${this.base}/clients`);
    }
    createClient(data: any): Observable<any> {
        return this.http.post(`${this.base}/clients`, data);
    }
    deleteClient(id: string): Observable<any> {
        return this.http.delete(`${this.base}/clients/${id}`);
    }
    updateClient(id: string, data: any): Observable<any> {
        return this.http.patch(`${this.base}/clients/${id}`, data);
    }

    // ---- VPS Nodes ----
    getVpsNodes(): Observable<any[]> {
        return this.http.get<any[]>(`${this.base}/vps-nodes`);
    }
    createVpsNode(data: any): Observable<any> {
        return this.http.post(`${this.base}/vps-nodes`, data);
    }
    testVpsConnection(id: string): Observable<any> {
        return this.http.post(`${this.base}/vps-nodes/${id}/test-connection`, {});
    }
    getVpsStats(id: string): Observable<any> {
        return this.http.get(`${this.base}/vps-nodes/${id}/stats`);
    }
    rebootVps(id: string): Observable<any> {
        return this.http.post(`${this.base}/vps-nodes/${id}/reboot`, {});
    }
    updateVpsNode(id: string, data: any): Observable<any> {
        return this.http.patch(`${this.base}/vps-nodes/${id}`, data);
    }
    deleteVpsNode(id: string): Observable<any> {
        return this.http.delete(`${this.base}/vps-nodes/${id}`);
    }

    // ---- Matrices / Provisioning ----
    getMatrices(): Observable<any[]> {
        return this.http.get<any[]>(`${this.base}/matrices`);
    }
    getMatrix(id: string): Observable<any> {
        return this.http.get(`${this.base}/matrices/${id}`);
    }
    provisionMatrix(data: { clientId: string; slug: string; vpsNodeId?: string }): Observable<any> {
        return this.http.post(`${this.base}/matrices`, data);
    }
    oneClickProvision(data: any): Observable<any> {
        return this.http.post(`${this.base}/matrices/one-click`, data);
    }
    suspendMatrix(id: string): Observable<any> {
        return this.http.post(`${this.base}/matrices/${id}/suspend`, {});
    }
    reactivateMatrix(id: string): Observable<any> {
        return this.http.post(`${this.base}/matrices/${id}/reactivate`, {});
    }
    updateMatrix(id: string): Observable<any> {
        return this.http.post(`${this.base}/matrices/${id}/update`, {});
    }
    deleteMatrix(id: string): Observable<any> {
        return this.http.post(`${this.base}/matrices/${id}/delete`, {});
    }
    migrateMatrix(id: string, targetVpsId: string): Observable<any> {
        return this.http.post(`${this.base}/matrices/${id}/migrate`, { targetVpsId });
    }

    // ---- Plugins ----
    getPlugins(status?: string): Observable<any[]> {
        const params = status ? `?status=${status}` : '';
        return this.http.get<any[]>(`${this.base}/plugins${params}`);
    }
    getPlugin(id: string): Observable<any> {
        return this.http.get(`${this.base}/plugins/${id}`);
    }
    createPlugin(data: any): Observable<any> {
        return this.http.post(`${this.base}/plugins`, data);
    }
    updatePlugin(id: string, data: any): Observable<any> {
        return this.http.patch(`${this.base}/plugins/${id}`, data);
    }
    publishPlugin(id: string): Observable<any> {
        return this.http.post(`${this.base}/plugins/${id}/publish`, {});
    }
    unpublishPlugin(id: string): Observable<any> {
        return this.http.post(`${this.base}/plugins/${id}/unpublish`, {});
    }
    archivePlugin(id: string): Observable<any> {
        return this.http.post(`${this.base}/plugins/${id}/archive`, {});
    }
    deletePlugin(id: string): Observable<any> {
        return this.http.delete(`${this.base}/plugins/${id}`);
    }

    // ---- Modules ----
    getModules(): Observable<any[]> {
        return this.http.get<any[]>(`${this.base}/modules`);
    }
    getModule(id: string): Observable<any> {
        return this.http.get(`${this.base}/modules/${id}`);
    }
    createModule(data: any): Observable<any> {
        return this.http.post(`${this.base}/modules`, data);
    }
    updateModule(id: string, data: any): Observable<any> {
        return this.http.patch(`${this.base}/modules/${id}`, data);
    }
    deleteModule(id: string): Observable<any> {
        return this.http.delete(`${this.base}/modules/${id}`);
    }
    getMatrixModules(matrixId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.base}/matrices/${matrixId}/modules`);
    }
    setMatrixModules(matrixId: string, modules: string[]): Observable<any> {
        return this.http.put(`${this.base}/matrices/${matrixId}/modules`, { modules });
    }

    // ---- Audit Logs ----
    getAuditLogs(params?: { action?: string; entity?: string; limit?: number; offset?: number }): Observable<any> {
        const parts: string[] = [];
        if (params?.action) parts.push(`action=${params.action}`);
        if (params?.entity) parts.push(`entity=${params.entity}`);
        if (params?.limit) parts.push(`limit=${params.limit}`);
        if (params?.offset !== undefined) parts.push(`offset=${params.offset}`);
        const qs = parts.length ? '?' + parts.join('&') : '';
        return this.http.get(`${this.base}/audit-logs${qs}`);
    }

    // ---- Workers Fleet ----
    getWorkers(): Observable<any[]> {
        return this.http.get<any[]>(`${this.base}/workers`);
    }
    createWorker(data: any): Observable<any> {
        return this.http.post(`${this.base}/workers`, data);
    }
    updateWorker(id: string, data: any): Observable<any> {
        return this.http.patch(`${this.base}/workers/${id}`, data);
    }
    deleteWorker(id: string): Observable<any> {
        return this.http.delete(`${this.base}/workers/${id}`);
    }
    getWorkerLiveStatus(id: string): Observable<any> {
        return this.http.get(`${this.base}/workers/${id}/live-status`);
    }

    // ---- Packages (Extensiones) ----
    getPackages(type?: string): Observable<any[]> {
        const params = type ? `?type=${type}` : '';
        return this.http.get<any[]>(`${this.base}/packages${params}`);
    }
    getPackage(id: string): Observable<any> {
        return this.http.get(`${this.base}/packages/${id}`);
    }
    createPackage(data: any): Observable<any> {
        return this.http.post(`${this.base}/packages`, data);
    }
    updatePackage(id: string, data: any): Observable<any> {
        return this.http.put(`${this.base}/packages/${id}`, data);
    }
    deletePackage(id: string): Observable<any> {
        return this.http.delete(`${this.base}/packages/${id}`);
    }
    getAvailablePackages(matrixId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.base}/packages/available/${matrixId}`);
    }
    getPackageAccess(id: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.base}/packages/${id}/access`);
    }
    setPackageAccess(id: string, clientIds: string[]): Observable<any> {
        return this.http.put(`${this.base}/packages/${id}/access`, { clientIds });
    }
    getMatrixPackages(matrixId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.base}/packages/matrix/${matrixId}`);
    }
    installPackageToMatrix(matrixId: string, packageId: string): Observable<any> {
        return this.http.post(`${this.base}/packages/matrix/${matrixId}/${packageId}/install`, {});
    }
    uninstallPackageFromMatrix(matrixId: string, packageId: string): Observable<any> {
        return this.http.delete(`${this.base}/packages/matrix/${matrixId}/${packageId}`);
    }
    updatePackageOnMatrix(matrixId: string, packageId: string): Observable<any> {
        return this.http.post(`${this.base}/packages/matrix/${matrixId}/${packageId}/update`, {});
    }

    // ---- Pricing Tiers ----
    getPricingTiers(): Observable<any[]> {
        return this.http.get<any[]>(`${this.base}/pricing`);
    }
    createPricingTier(data: any): Observable<any> {
        return this.http.post(`${this.base}/pricing`, data);
    }
    updatePricingTier(id: string, data: any): Observable<any> {
        return this.http.put(`${this.base}/pricing/${id}`, data);
    }
    deletePricingTier(id: string): Observable<any> {
        return this.http.delete(`${this.base}/pricing/${id}`);
    }
}
