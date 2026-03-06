const OvhEngine = require('@ovh-api/api').default || require('@ovh-api/api');

async function main() {
    const engine = new OvhEngine({
        appKey: 'e342c3c0ead8534c',
        appSecret: 'be5f0b87ab1d170589d683381483a03e',
        consumerKey: '9c162cfe19eef757ca9891237b9100b6',
        endpoint: 'ovh-eu',
    });

    console.log('========================================');
    console.log('  OVH Infrastructure Explorer');
    console.log('========================================\n');

    // 1. List VPS
    console.log('--- VPS ---');
    try {
        const vpsList = await engine.request('GET', '/vps');
        console.log(`Found ${vpsList.length} VPS(s):\n`);
        for (const vpsName of vpsList) {
            const vps = await engine.request('GET', `/vps/${vpsName}`);
            const ips = await engine.request('GET', `/vps/${vpsName}/ips`);
            console.log(`  Name:      ${vpsName}`);
            console.log(`  Display:   ${vps.displayName || 'N/A'}`);
            console.log(`  State:     ${vps.state}`);
            console.log(`  Model:     ${vps.model?.name || 'N/A'} (${vps.model?.offer || 'N/A'})`);
            console.log(`  vCores:    ${vps.vcore}`);
            console.log(`  RAM:       ${vps.memoryLimit} MB`);
            console.log(`  Disk:      ${vps.model?.disk || 'N/A'} GB`);
            console.log(`  Zone:      ${vps.zone}`);
            console.log(`  IPs:       ${ips.join(', ')}`);
            console.log(`  Cluster:   ${vps.cluster}`);
            console.log('');
        }
    } catch (e) {
        console.log(`  Error: ${e.message || JSON.stringify(e)}`);
    }

    // 2. List Dedicated Servers
    console.log('--- DEDICATED SERVERS ---');
    try {
        const serverList = await engine.request('GET', '/dedicated/server');
        console.log(`Found ${serverList.length} dedicated server(s):\n`);
        for (const serverName of serverList) {
            const server = await engine.request('GET', `/dedicated/server/${serverName}`);
            let ips = [];
            try { ips = await engine.request('GET', `/dedicated/server/${serverName}/ips`); } catch (e) { }
            console.log(`  Name:       ${serverName}`);
            console.log(`  Reverse:    ${server.reverse || 'N/A'}`);
            console.log(`  State:      ${server.state}`);
            console.log(`  Datacenter: ${server.datacenter}`);
            console.log(`  Rack:       ${server.rack || 'N/A'}`);
            console.log(`  OS:         ${server.os || 'N/A'}`);
            console.log(`  Range:      ${server.commercialRange || 'N/A'}`);
            console.log(`  IPs:        ${ips.join(', ') || 'N/A'}`);
            console.log('');
        }
    } catch (e) {
        console.log(`  Error: ${e.message || JSON.stringify(e)}`);
    }

    console.log('========================================');
    console.log('  Done!');
    console.log('========================================');
}

main().catch(err => {
    console.error('Fatal error:', err.message || JSON.stringify(err));
    process.exit(1);
});
