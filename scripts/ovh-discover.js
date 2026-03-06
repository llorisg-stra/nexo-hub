const OvhEngine = require('@ovh-api/api').default || require('@ovh-api/api');

async function main() {
    const engine = new OvhEngine({
        appKey: 'e342c3c0ead8534c',
        appSecret: 'be5f0b87ab1d170589d683381483a03e',
        consumerKey: '9c162cfe19eef757ca9891237b9100b6',
        endpoint: 'ovh-eu',
    });

    const vps1 = 'vps-81688f30.vps.ovh.net';

    // 1. Check current image
    console.log('=== Current Image ===');
    try {
        const current = await engine.request('GET', `/vps/${vps1}/images/current`);
        console.log(`  ${JSON.stringify(current)}`);
    } catch (e) { console.log(`  ${e.message}`); }

    // 2. List ALL available images
    console.log('\n=== Available Images ===');
    try {
        const images = await engine.request('GET', `/vps/${vps1}/images/available`);
        console.log(`  Found ${images.length} images`);
        for (const imgId of images) {
            const img = await engine.request('GET', `/vps/${vps1}/images/available/${imgId}`);
            console.log(`  ${imgId} -> ${img.name}`);
        }
    } catch (e) { console.log(`  ${e.message}`); }

    // 3. SSH keys
    console.log('\n=== SSH Keys ===');
    try {
        const keys = await engine.request('GET', '/me/sshKey');
        console.log(`  Found: ${JSON.stringify(keys)}`);
        for (const k of keys) {
            const detail = await engine.request('GET', `/me/sshKey/${k}`);
            console.log(`  ${k}: ${detail.key.substring(0, 80)}...`);
        }
    } catch (e) { console.log(`  ${e.message}`); }

    // 4. Current distribution
    console.log('\n=== Current Distribution ===');
    try {
        const dist = await engine.request('GET', `/vps/${vps1}/distribution`);
        console.log(`  ${JSON.stringify(dist)}`);
    } catch (e) { console.log(`  ${e.message}`); }
}

main().catch(err => { console.error('Error:', err.message); });
