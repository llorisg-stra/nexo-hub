import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    Query,
} from '@nestjs/common';
import { PackagesService } from './packages.service';
import { CreatePackageDto, UpdatePackageDto } from './dto/package.dto';

/**
 * Packages Controller — Unified extension catalog CRUD + matrix install/uninstall.
 */
@Controller('api/packages')
export class PackagesController {
    constructor(private readonly packages: PackagesService) { }

    // ── Catalog ──────────────────────────────────────

    @Get()
    findAll(@Query('type') type?: string) {
        return this.packages.findAll(type);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.packages.findOne(id);
    }

    @Post()
    create(@Body() dto: CreatePackageDto) {
        return this.packages.create(dto);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
        return this.packages.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.packages.remove(id);
    }

    // ── Matrix Installations ─────────────────────────

    @Get('available/:matrixId')
    getAvailableForMatrix(@Param('matrixId') matrixId: string) {
        return this.packages.findAvailableForMatrix(matrixId);
    }

    @Get(':id/access')
    getAccess(@Param('id') id: string) {
        return this.packages.getAccess(id);
    }

    @Put(':id/access')
    setAccess(@Param('id') id: string, @Body() body: { clientIds: string[] }) {
        return this.packages.setAccess(id, body.clientIds);
    }

    @Get('matrix/:matrixId')
    getMatrixPackages(@Param('matrixId') matrixId: string) {
        return this.packages.getMatrixPackages(matrixId);
    }

    @Post('matrix/:matrixId/:packageId/install')
    install(
        @Param('matrixId') matrixId: string,
        @Param('packageId') packageId: string,
    ) {
        return this.packages.installToMatrix(matrixId, packageId);
    }

    @Delete('matrix/:matrixId/:packageId')
    uninstall(
        @Param('matrixId') matrixId: string,
        @Param('packageId') packageId: string,
    ) {
        return this.packages.uninstallFromMatrix(matrixId, packageId);
    }

    @Post('matrix/:matrixId/:packageId/update')
    updatePackageOnMatrix(
        @Param('matrixId') matrixId: string,
        @Param('packageId') packageId: string,
    ) {
        return this.packages.updateOnMatrix(matrixId, packageId);
    }
}
