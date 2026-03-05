import { Module } from '@nestjs/common';
import { OvhService } from './ovh.service';
import { OvhController } from './ovh.controller';

@Module({
    controllers: [OvhController],
    providers: [OvhService],
    exports: [OvhService],
})
export class OvhModule { }
