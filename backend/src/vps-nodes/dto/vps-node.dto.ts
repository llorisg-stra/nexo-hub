import {
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import { VpsProvider } from '@prisma/client';

export class CreateVpsNodeDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    host: string;

    @IsOptional()
    @IsString()
    ip?: string;

    @IsOptional()
    @IsString()
    sshUser?: string;

    @IsOptional()
    @IsString()
    sshKeyPath?: string;

    @IsOptional()
    @IsInt()
    sshPort?: number;

    @IsOptional()
    @IsEnum(VpsProvider)
    provider?: VpsProvider;

    @IsOptional()
    @IsString()
    region?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    maxMatrices?: number;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateVpsNodeDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    host?: string;

    @IsOptional()
    @IsString()
    ip?: string;

    @IsOptional()
    @IsString()
    sshUser?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    maxMatrices?: number;

    @IsOptional()
    @IsString()
    notes?: string;
}
