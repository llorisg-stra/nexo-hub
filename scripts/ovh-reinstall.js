const OvhEngine = require('@ovh-api/api').default || require('@ovh-api/api');

async function main() {
    const engine = new OvhEngine({
        appKey: 'e342c3c0ead8534c',
        appSecret: 'be5f0b87ab1d170589d683381483a03e',
        consumerKey: '9c162cfe19eef757ca9891237b9100b6',
        endpoint: 'ovh-eu',
    });

    const vps1 = 'vps-81688f30.vps.ovh.net';

    // Get templates
    console.log('=== Templates ===');
    try {
        const templates = await engine.request('GET', `/vps/${vps1}/templates`);
        console.log(`Found ${templates.length} template IDs: ${templates.join(', ')}`);
    } catch (e) {
        console.log(`templates error: ${e.message}`);
    }

    // Get distribution software  
    console.log('\n=== Distribution ===');
    try {
        const dist = await engine.request('GET', `/vps/${vps1}/distribution`);
        console.log(JSON.stringify(dist, null, 2));
    } catch (e) {
        console.log(`distribution error: ${e.message}`);
    }

    // Check current image
    console.log('\n=== Current Image ===');
    try {
        const img = await engine.request('GET', `/vps/${vps1}/images/current`);
        console.log(JSON.stringify(img, null, 2));
    } catch (e) {
        console.log(`current image error: ${e.message}`);
    }

    // SSH keys on account
    console.log('\n=== SSH Keys ===');
    try {
        const keys = await engine.request('GET', '/me/sshKey');
        for (const k of keys) {
            const detail = await engine.request('GET', `/me/sshKey/${k}`);
            console.log(`${k}: ${detail.key.substring(0, 80)}...`);
        }
    } catch (e) {
        console.log(`ssh keys error: ${e.message}`);
    }

    // Try reinstall API
    console.log('\n=== Attempting reinstall with sshKey ===');
    // First get the distribution template ID for current image
    try {
        const dist = await engine.request('GET', `/vps/${vps1}/distribution`);
        const templateId = dist.id;
        console.log(`Using template ID: ${templateId} (${dist.name})`);

        const task = await engine.request('POST', `/vps/${vps1}/reinstall`, {
            templateId: templateId,
            sshKey: ['nexo-admin'],
            doNotSendPassword: false
        });
        console.log(`Nexo Core 1 reinstall task: ${task.id} -> ${task.state}`);
    } catch (e) {
        console.log(`reinstall error: ${e.message || JSON.stringify(e)}`);
    }
}

main().catch(err => { console.error('Fatal:', err.message); });
