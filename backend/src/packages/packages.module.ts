import { Module } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { PackagesController } from './packages.controller';
import { SshModule } from '../ssh';

@Module({
    imports: [SshModule],
    controllers: [PackagesController],
    providers: [PackagesService],
    exports: [PackagesService],
})
export class PackagesModule { }
