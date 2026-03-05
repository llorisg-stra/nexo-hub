import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma';
import { SshModule } from './ssh';
import { ClientsModule } from './clients/clients.module';
import { VpsNodesModule } from './vps-nodes/vps-nodes.module';
import { ProvisioningModule } from './provisioning/provisioning.module';
import { PluginCatalogModule } from './plugin-catalog';
import { ModulesModule } from './modules/modules.module';
import { PackagesModule } from './packages';
import { AuditModule } from './audit/audit.module';
import { AuditInterceptor } from './audit/audit.interceptor';
import { WorkersModule } from './workers/workers.module';
import { PricingModule } from './pricing/pricing.module';
import { OvhModule } from './ovh';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    SshModule,
    ClientsModule,
    VpsNodesModule,
    ProvisioningModule,
    PluginCatalogModule,
    ModulesModule,
    PackagesModule,
    AuditModule,
    WorkersModule,
    PricingModule,
    OvhModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule { }
