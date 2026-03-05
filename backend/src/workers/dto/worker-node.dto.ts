import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateWorkerNodeDto {
    @IsString()
    name: string;

    @IsString()
    host: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    apiPort?: number;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateWorkerNodeDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    host?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    apiPort?: number;

    @IsOptional()
    @IsString()
    notes?: string;
}

/** DTO received from the worker's heartbeat */
export class WorkerHeartbeatDto {
    @IsString()
    workerId: string;

    @IsOptional()
    @IsInt()
    cpuCores?: number;

    @IsOptional()
    @IsInt()
    ramTotalMb?: number;

    @IsOptional()
    @IsInt()
    ramUsedMb?: number;

    @IsOptional()
    @IsInt()
    activeJobs?: number;

    @IsOptional()
    @IsInt()
    totalProcessed?: number;
}
