const OvhEngine = require('@ovh-api/api').default || require('@ovh-api/api');

async function main() {
    const engine = new OvhEngine({
        appKey: 'e342c3c0ead8534c',
        appSecret: 'be5f0b87ab1d170589d683381483a03e',
        consumerKey: '9c162cfe19eef757ca9891237b9100b6',
        endpoint: 'ovh-eu',
    });

    const vpsList = [
        { name: 'vps-81688f30.vps.ovh.net', label: 'Nexo Core 1' },
        { name: 'vps-fcb514e7.vps.ovh.net', label: 'Nexo Core 2' },
    ];

    for (const vps of vpsList) {
        console.log(`--- Resetting password: ${vps.label} ---`);
        try {
            const task = await engine.request('POST', `/vps/${vps.name}/setPassword`);
            console.log(`  Task: ${task.id} (${task.type}) -> ${task.state}`);
        } catch (e) {
            console.log(`  Error: ${e.message || JSON.stringify(e)}`);
        }
    }

    console.log('\nPasswords will be sent to your OVH email. Check your inbox!');
}

main().catch(err => { console.error('Fatal:', err.message); });
