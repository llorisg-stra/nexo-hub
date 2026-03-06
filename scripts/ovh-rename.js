const OvhEngine = require('@ovh-api/api').default || require('@ovh-api/api');

async function main() {
    const engine = new OvhEngine({
        appKey: 'e342c3c0ead8534c',
        appSecret: 'be5f0b87ab1d170589d683381483a03e',
        consumerKey: '9c162cfe19eef757ca9891237b9100b6',
        endpoint: 'ovh-eu',
    });

    // Rename VPS #2 (SBG6, 51.210.9.224)
    console.log('Renaming vps-81688f30 -> "Nexo Core 1"...');
    await engine.request('PUT', '/vps/vps-81688f30.vps.ovh.net', { displayName: 'Nexo Core 1' });
    console.log('  OK');

    // Rename VPS #5 (SBG6, 51.210.11.84)
    console.log('Renaming vps-fcb514e7 -> "Nexo Core 2"...');
    await engine.request('PUT', '/vps/vps-fcb514e7.vps.ovh.net', { displayName: 'Nexo Core 2' });
    console.log('  OK');

    console.log('\nDone! Verifying...\n');

    // Verify
    const vpsList = await engine.request('GET', '/vps');
    for (const name of vpsList) {
        const vps = await engine.request('GET', `/vps/${name}`);
        const ips = await engine.request('GET', `/vps/${name}/ips`);
        const ipv4 = ips.find(ip => !ip.includes(':')) || 'N/A';
        console.log(`  ${vps.displayName || name}  ->  ${ipv4}  (${vps.zone})`);
    }
}

main().catch(err => { console.error('Error:', err.message || JSON.stringify(err)); process.exit(1); });
