import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { PricingService } from './pricing.service';

@Controller('pricing')
export class PricingController {
    constructor(private readonly pricingService: PricingService) { }

    @Get()
    findAll() {
        return this.pricingService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.pricingService.findOne(id);
    }

    @Post()
    create(@Body() data: any) {
        return this.pricingService.create(data);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: any) {
        return this.pricingService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.pricingService.remove(id);
    }
}
