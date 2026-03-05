import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';
import { ClientPlan } from '@prisma/client';

export class CreateClientDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    company?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsEnum(ClientPlan)
    plan?: ClientPlan;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    metadata?: Record<string, unknown>;
}

export class UpdateClientDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    company?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsEnum(ClientPlan)
    plan?: ClientPlan;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    metadata?: Record<string, unknown>;
}
