import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    ParseUUIDPipe,
} from '@nestjs/common';
import { PluginCatalogService } from './plugin-catalog.service';
import { CreatePluginTemplateDto, UpdatePluginTemplateDto } from './dto/plugin-template.dto';

@Controller('api/plugins')
export class PluginCatalogController {
    constructor(private readonly catalogService: PluginCatalogService) { }

    @Post()
    create(@Body() dto: CreatePluginTemplateDto) {
        return this.catalogService.create(dto);
    }

    @Get()
    findAll(@Query('status') status?: string) {
        return this.catalogService.findAll(status);
    }

    @Get('published')
    findPublished() {
        return this.catalogService.findPublished();
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.catalogService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdatePluginTemplateDto,
    ) {
        return this.catalogService.update(id, dto);
    }

    @Post(':id/publish')
    publish(@Param('id', ParseUUIDPipe) id: string) {
        return this.catalogService.publish(id);
    }

    @Post(':id/unpublish')
    unpublish(@Param('id', ParseUUIDPipe) id: string) {
        return this.catalogService.unpublish(id);
    }

    @Post(':id/archive')
    archive(@Param('id', ParseUUIDPipe) id: string) {
        return this.catalogService.archive(id);
    }

    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.catalogService.remove(id);
    }
}
