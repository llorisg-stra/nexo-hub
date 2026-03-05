import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PricingService {
    constructor(private prisma: PrismaService) { }

    findAll() {
        return this.prisma.pricingTier.findMany({ orderBy: { price: 'asc' } });
    }

    findOne(id: string) {
        return this.prisma.pricingTier.findUnique({ where: { id } });
    }

    findByName(name: string) {
        return this.prisma.pricingTier.findUnique({ where: { name: name as any } });
    }

    create(data: any) {
        return this.prisma.pricingTier.create({ data });
    }

    update(id: string, data: any) {
        return this.prisma.pricingTier.update({ where: { id }, data });
    }

    remove(id: string) {
        return this.prisma.pricingTier.delete({ where: { id } });
    }
}
