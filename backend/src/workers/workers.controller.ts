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
import { WorkersService } from './workers.service';
import { CreateWorkerNodeDto, UpdateWorkerNodeDto, WorkerHeartbeatDto } from './dto/worker-node.dto';

@Controller('api/workers')
export class WorkersController {
    constructor(private readonly workersService: WorkersService) { }

    @Post()
    create(@Body() dto: CreateWorkerNodeDto) {
        return this.workersService.create(dto);
    }

    @Get()
    findAll() {
        return this.workersService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.workersService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateWorkerNodeDto,
    ) {
        return this.workersService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.workersService.remove(id);
    }

    /** Worker calls this to register/heartbeat */
    @Post('heartbeat')
    heartbeat(@Body() dto: WorkerHeartbeatDto) {
        return this.workersService.heartbeat(dto);
    }

    /** Poll worker's live status */
    @Get(':id/live-status')
    getLiveStatus(@Param('id', ParseUUIDPipe) id: string) {
        return this.workersService.getLiveStatus(id);
    }
}
