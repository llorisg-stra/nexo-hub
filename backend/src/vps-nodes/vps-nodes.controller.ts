import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    ParseUUIDPipe,
} from '@nestjs/common';
import { VpsNodesService } from './vps-nodes.service';
import { CreateVpsNodeDto, UpdateVpsNodeDto } from './dto/vps-node.dto';

@Controller('api/vps-nodes')
export class VpsNodesController {
    constructor(private readonly vpsNodesService: VpsNodesService) { }

    @Post()
    create(@Body() dto: CreateVpsNodeDto) {
        return this.vpsNodesService.create(dto);
    }

    @Get()
    findAll() {
        return this.vpsNodesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.vpsNodesService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateVpsNodeDto,
    ) {
        return this.vpsNodesService.update(id, dto);
    }

    @Post(':id/test-connection')
    testConnection(@Param('id', ParseUUIDPipe) id: string) {
        return this.vpsNodesService.testConnection(id);
    }

    @Get(':id/stats')
    getStats(@Param('id', ParseUUIDPipe) id: string) {
        return this.vpsNodesService.getStats(id);
    }

    @Post(':id/reboot')
    reboot(@Param('id', ParseUUIDPipe) id: string) {
        return this.vpsNodesService.reboot(id);
    }

    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.vpsNodesService.remove(id);
    }
}
