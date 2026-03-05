import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber } from 'class-validator';

export enum PackageTypeDto {
    CHANNEL = 'CHANNEL',
    CONNECTOR = 'CONNECTOR',
    MODULE = 'MODULE',
    PLUGIN = 'PLUGIN',
    SKILL = 'SKILL',
}

export class CreatePackageDto {
    @IsString()
    name: string;

    @IsString()
    displayName: string;

    @IsEnum(PackageTypeDto)
    type: PackageTypeDto;

    @IsString()
    repoUrl: string;

    @IsString()
    @IsOptional()
    version?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    icon?: string;

    @IsString()
    @IsOptional()
    author?: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsBoolean()
    @IsOptional()
    isCore?: boolean;

    @IsString()
    @IsOptional()
    visibility?: 'PUBLIC' | 'PRIVATE';

    @IsNumber()
    @IsOptional()
    price?: number;

    @IsString()
    @IsOptional()
    pricingModel?: 'FREE' | 'INCLUDED_IN_TIER' | 'MONTHLY' | 'ONE_TIME';

    @IsString()
    @IsOptional()
    stripePriceId?: string;
}

export class UpdatePackageDto {
    @IsString()
    @IsOptional()
    displayName?: string;

    @IsString()
    @IsOptional()
    version?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    icon?: string;

    @IsString()
    @IsOptional()
    repoUrl?: string;

    @IsString()
    @IsOptional()
    author?: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsBoolean()
    @IsOptional()
    isCore?: boolean;

    @IsString()
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    visibility?: 'PUBLIC' | 'PRIVATE';

    @IsNumber()
    @IsOptional()
    price?: number;

    @IsString()
    @IsOptional()
    pricingModel?: 'FREE' | 'INCLUDED_IN_TIER' | 'MONTHLY' | 'ONE_TIME';

    @IsString()
    @IsOptional()
    stripePriceId?: string;
}
