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
        console.log(`--- ${vps.label} (${vps.name}) ---`);
        const info = await engine.request('GET', `/vps/${vps.name}`);
        console.log(`  State: ${info.state}`);

        const tasks = await engine.request('GET', `/vps/${vps.name}/tasks`);
        for (const tid of tasks.slice(-3)) {
            const task = await engine.request('GET', `/vps/${vps.name}/tasks/${tid}`);
            console.log(`  Task ${tid}: ${task.type} -> ${task.state} (${task.progress}%)`);
        }
        console.log('');
    }
}

main().catch(err => { console.error('Error:', err.message); });
