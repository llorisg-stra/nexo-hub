import { IsString, IsOptional, IsArray, IsEnum, IsObject } from 'class-validator';

export enum PluginStatusDto {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    ARCHIVED = 'ARCHIVED',
}

export class CreatePluginTemplateDto {
    @IsString()
    name: string;

    @IsString()
    description: string;

    @IsString()
    code: string;

    @IsOptional()
    @IsString()
    version?: string;

    @IsOptional()
    @IsString()
    author?: string;

    @IsOptional()
    @IsString()
    icon?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    supportedChannels?: string[];

    @IsOptional()
    @IsObject()
    configSchema?: Record<string, unknown>;
}

export class UpdatePluginTemplateDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    code?: string;

    @IsOptional()
    @IsString()
    version?: string;

    @IsOptional()
    @IsString()
    author?: string;

    @IsOptional()
    @IsString()
    icon?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    supportedChannels?: string[];

    @IsOptional()
    @IsObject()
    configSchema?: Record<string, unknown>;

    @IsOptional()
    @IsEnum(PluginStatusDto)
    status?: PluginStatusDto;
}
