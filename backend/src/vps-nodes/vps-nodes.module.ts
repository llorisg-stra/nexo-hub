import { Module } from '@nestjs/common';
import { VpsNodesService } from './vps-nodes.service';
import { VpsNodesController } from './vps-nodes.controller';

@Module({
    controllers: [VpsNodesController],
    providers: [VpsNodesService],
    exports: [VpsNodesService],
})
export class VpsNodesModule { }
