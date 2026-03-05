import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { OvhService } from './ovh.service';

@Controller('api/ovh')
export class OvhController {
    constructor(private readonly ovh: OvhService) { }

    // ── VPS ─────────────────────────────────────────────────

    /** GET /api/ovh/vps — List all OVH VPS with details */
    @Get('vps')
    listVps() {
        return this.ovh.listVpsWithDetails();
    }

    /** GET /api/ovh/vps/:name — Get single VPS details */
    @Get('vps/:name')
    getVpsDetails(@Param('name') name: string) {
        return this.ovh.getVpsDetails(name);
    }

    /** GET /api/ovh/vps/:name/status — Get VPS status */
    @Get('vps/:name/status')
    getVpsStatus(@Param('name') name: string) {
        return this.ovh.getVpsStatus(name);
    }

    /** GET /api/ovh/vps/:name/monitoring — Get VPS monitoring data */
    @Get('vps/:name/monitoring')
    getMonitoring(
        @Param('name') name: string,
        @Query('period') period?: 'lastday' | 'lastweek' | 'lastmonth',
    ) {
        return this.ovh.getMonitoring(name, period || 'lastday');
    }

    /** GET /api/ovh/vps/:name/images — Get available OS images */
    @Get('vps/:name/images')
    getAvailableImages(@Param('name') name: string) {
        return this.ovh.getAvailableImages(name);
    }

    /** POST /api/ovh/vps/:name/reinstall?imageId=xxx — Reinstall VPS */
    @Post('vps/:name/reinstall')
    reinstallVps(
        @Param('name') name: string,
        @Query('imageId') imageId: string,
    ) {
        return this.ovh.reinstallVps(name, imageId);
    }

    /** POST /api/ovh/vps/:name/reboot — Hard reboot via OVH API */
    @Post('vps/:name/reboot')
    rebootVps(@Param('name') name: string) {
        return this.ovh.rebootVps(name);
    }

    /** POST /api/ovh/vps/:name/rename?displayName=xxx — Rename VPS */
    @Post('vps/:name/rename')
    renameVps(
        @Param('name') name: string,
        @Query('displayName') displayName: string,
    ) {
        return this.ovh.renameVps(name, displayName);
    }

    // ── Dedicated Servers ───────────────────────────────────

    /** GET /api/ovh/dedicated — List all dedicated servers */
    @Get('dedicated')
    listDedicated() {
        return this.ovh.listDedicatedServers();
    }

    /** GET /api/ovh/dedicated/:name — Get dedicated server details */
    @Get('dedicated/:name')
    getDedicatedDetails(@Param('name') name: string) {
        return this.ovh.getDedicatedServerDetails(name);
    }
}
