import { Module } from '@nestjs/common';
import { PluginCatalogService } from './plugin-catalog.service';
import { PluginCatalogController } from './plugin-catalog.controller';

@Module({
    controllers: [PluginCatalogController],
    providers: [PluginCatalogService],
    exports: [PluginCatalogService],
})
export class PluginCatalogModule { }
