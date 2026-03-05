import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { WorkersController } from './workers.controller';
import { WorkersService } from './workers.service';

@Module({
    imports: [PrismaModule],
    controllers: [WorkersController],
    providers: [WorkersService],
    exports: [WorkersService],
})
export class WorkersModule { }
