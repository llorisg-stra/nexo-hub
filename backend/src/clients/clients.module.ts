import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { SupabaseAdminService } from '../provisioning/supabase-admin.service';

@Module({
    controllers: [ClientsController],
    providers: [ClientsService, SupabaseAdminService],
    exports: [ClientsService],
})
export class ClientsModule { }
