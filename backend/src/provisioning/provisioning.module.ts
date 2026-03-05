import { Module } from '@nestjs/common';
import { ProvisioningService } from './provisioning.service';
import { TemplateGeneratorService } from './template-generator.service';
import { CloudflareService } from './cloudflare.service';
import { SupabaseAdminService } from './supabase-admin.service';
import { MatricesController } from './matrices.controller';
import { WebhooksController } from './webhooks.controller';
import { VpsNodesModule } from '../vps-nodes/vps-nodes.module';
import { ClientsModule } from '../clients/clients.module';
import { PluginCatalogModule } from '../plugin-catalog/plugin-catalog.module';
import { ModulesModule } from '../modules/modules.module';
import { PackagesModule } from '../packages';

@Module({
    imports: [VpsNodesModule, ClientsModule, PluginCatalogModule, ModulesModule, PackagesModule],
    controllers: [MatricesController, WebhooksController],
    providers: [ProvisioningService, TemplateGeneratorService, CloudflareService, SupabaseAdminService],
    exports: [ProvisioningService],
})
export class ProvisioningModule { }

