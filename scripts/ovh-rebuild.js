const OvhEngine = require('@ovh-api/api').default || require('@ovh-api/api');
const fs = require('fs');
const path = require('path');

async function main() {
    const engine = new OvhEngine({
        appKey: 'e342c3c0ead8534c',
        appSecret: 'be5f0b87ab1d170589d683381483a03e',
        consumerKey: '9c162cfe19eef757ca9891237b9100b6',
        endpoint: 'ovh-eu',
    });

    const sshPubKeyPath = path.join(process.env.USERPROFILE, '.ssh', 'id_ed25519.pub');
    const sshPubKey = fs.readFileSync(sshPubKeyPath, 'utf8').trim();
    const imageId = '15571bc2-76ec-4a06-ad8d-74d0572794f6'; // Ubuntu 24.04

    const vpsList = [
        { name: 'vps-81688f30.vps.ovh.net', label: 'Nexo Core 1' },
        { name: 'vps-fcb514e7.vps.ovh.net', label: 'Nexo Core 2' },
    ];

    for (const vps of vpsList) {
        console.log(`--- Rebuilding ${vps.label} with publicSshKey ---`);
        try {
            const task = await engine.request('POST', `/vps/${vps.name}/rebuild`, {
                imageId: imageId,
                publicSshKey: sshPubKey,
                doNotSendPassword: false
            });
            console.log(`  Task: ${task.id} (${task.type}) -> ${task.state}`);
        } catch (e) {
            console.log(`  Error: ${e.message || JSON.stringify(e)}`);
        }
    }

    console.log('\nRebuilds triggered. Waiting 60s to check status...');
    await new Promise(r => setTimeout(r, 60000));

    for (const vps of vpsList) {
        const info = await engine.request('GET', `/vps/${vps.name}`);
        const tasks = await engine.request('GET', `/vps/${vps.name}/tasks`);
        const lastTask = tasks[tasks.length - 1];
        const taskDetail = await engine.request('GET', `/vps/${vps.name}/tasks/${lastTask}`);
        console.log(`${vps.label}: state=${info.state}, task=${taskDetail.type} ${taskDetail.state} (${taskDetail.progress}%)`);
    }
}

main().catch(err => { console.error('Fatal:', err.message); });
