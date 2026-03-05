import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Put,
    Body,
    Param,
} from '@nestjs/common';
import { ModulesService } from './modules.service';

@Controller('api/modules')
export class ModulesController {
    constructor(private readonly modules: ModulesService) { }

    // ── Module Catalog ──

    @Get()
    findAll() {
        return this.modules.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.modules.findOne(id);
    }

    @Post()
    create(
        @Body()
        body: {
            name: string;
            slug: string;
            description?: string;
            icon?: string;
            category?: string;
            isCore?: boolean;
        },
    ) {
        return this.modules.create(body);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body()
        body: {
            name?: string;
            description?: string;
            icon?: string;
            category?: string;
            isCore?: boolean;
        },
    ) {
        return this.modules.update(id, body);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.modules.remove(id);
    }
}
